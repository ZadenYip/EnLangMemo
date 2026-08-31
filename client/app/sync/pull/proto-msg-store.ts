import { PullResponse, PullResponseSchema } from "@enlangmemo/sync-api";
import { fromBinary, toBinary } from "@bufbuild/protobuf";
import { createHash } from "crypto";
import { getCurAccountDir, } from "@main/paths.js";
import path from "path/win32";
import { createReadStream, createWriteStream, existsSync, mkdirSync, ReadStream, renameSync, rmSync, WriteStream } from "fs";
import Logger from "electron-log/main.js";
import { finished } from "stream/promises";
import { once } from "events";

const BIN_FILE_NAME = "pull-responses.bin";
const PULL_DIR_NAME = "pull";

let stream: WriteStream | null = null;

export function openPullWriterStream(): void {
    Logger.info("openPullWriterStream called");
    const curAccountDir = getCurAccountDir();
    const pullDir = path.join(curAccountDir, PULL_DIR_NAME);
    if (!existsSync(pullDir)) {
        mkdirSync(pullDir, { recursive: true });
    }
    stream = createWriteStream(protoMsgPath(true));
}

async function writeChunk(stream: WriteStream, chunk: Uint8Array): Promise<void> {
    if (!stream.write(chunk)) {
        await once(stream, "drain");
    }
}

export async function decodePullResp(resp: PullResponse): Promise<void> {
    Logger.info(`decodePullResp called: batchSeq=${resp.batchSeq}, changes=${resp.changes.length}, lastBatch=${resp.lastBatch}`);
    const respBinary = toBinary(PullResponseSchema, resp);
    const lengthHeaderBuffer = lengthHeader(respBinary.length);
    const hash = createHash("sha256");
    hash.update(lengthHeaderBuffer);
    hash.update(respBinary);
    const sha256 = hash.digest("hex");

    await writeChunk(stream!, lengthHeaderBuffer);
    await writeChunk(stream!, respBinary);
    await writeChunk(stream!, Buffer.from(sha256, "hex"));

    if (resp.lastBatch === true) {
        stream!.end();
        await finished(stream!);
        renameSync(protoMsgPath(true), protoMsgPath());
        Logger.info(`pull response file renamed to ${BIN_FILE_NAME}`);
    }
    Logger.info(`decodePullResp finished: batchSeq=${resp.batchSeq}, lastBatch=${resp.lastBatch}`);
}

export async function* readPullResps(): AsyncGenerator<PullResponse> {
    Logger.info("readPullResps called");
    const filePath = protoMsgPath();
    if (!existsSync(filePath)) {
        throw new Error(`pull response file not found: ${filePath}`);
    }

    const readStream = createReadStream(filePath);
    for await (const resp of readFrames(readStream)) {
        Logger.info(`readPullResps: read a pull response: batchSeq=${resp.batchSeq}, changes=${resp.changes.length}, lastBatch=${resp.lastBatch}`);
        yield resp;
    }
    
}

async function* readFrames(readStream: ReadStream): AsyncGenerator<PullResponse> {
    let buffer = Buffer.alloc(0);
    for await (const chunk of readStream) {
        buffer = Buffer.concat([buffer, chunk as Buffer]);

        // length header is 4 bytes
        while (buffer.length >= 4) {
            const lengthBuffer = buffer.subarray(0, 4);
            const lengthHeader = buffer.readUInt32LE(0);
            
            // [length_header: 4 bytes][payload: length_header bytes][sha256: 32 bytes]
            if (buffer.length < 4 + lengthHeader + 32) {
                break;
            }
            const respBuffer = buffer.subarray(4, 4 + lengthHeader);
            const sha256Buffer = buffer.subarray(4 + lengthHeader, 4 + lengthHeader + 32);
            
            const hash = createHash("sha256");
            hash.update(lengthBuffer);
            hash.update(respBuffer);
            const computedSha256 = hash.digest();
            if (!computedSha256.equals(sha256Buffer)) {
                throw new Error("pull response file integrity check failed");
            }

            const resp = fromBinary(PullResponseSchema, respBuffer);
            yield resp;
            buffer = buffer.subarray(4 + lengthHeader + 32);
        }
    }
    if (buffer.length > 0) {
        throw new Error("pull response file is corrupted: unexpected end of file");
    }
    return;
}


function protoMsgPath(tmp?: boolean): string {
    const curAccountDir = getCurAccountDir();
    const pullDir = path.join(curAccountDir, PULL_DIR_NAME);
    return path.join(pullDir, BIN_FILE_NAME + (tmp ? ".tmp" : ""));
}

export function clearPullStore(): void {
    Logger.info("clearPullStore called");
    if (stream !== null) {
        stream.destroy();
        stream = null;
    }
    const pullDir = path.join(getCurAccountDir(), PULL_DIR_NAME);
    if (existsSync(pullDir)) {
        rmSync(pullDir, { recursive: true, force: true });
    }
}

function lengthHeader(length: number): Buffer {
    if (length < 0 || length > 0xFFFFFFFF) {
        throw new Error(`proto-msg-store: length header must be a 32-bit unsigned integer, got ${length}`);
    }
    const lengthHeader = Buffer.allocUnsafe(4);
    lengthHeader.writeUInt32LE(length, 0);
    return lengthHeader;
}
