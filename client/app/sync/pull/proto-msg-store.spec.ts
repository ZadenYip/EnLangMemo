import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { create } from "@bufbuild/protobuf";
import { ChangeOp, EntityType, NotePayloadSchema, PullResponse, PullResponseSchema, SyncChange, SyncChangeSchema } from "@enlangmemo/sync-api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPullStore, decodePullResp, readPullResps, openPullWriterStream } from "./proto-msg-store.js";
import { generateUUIDV7 } from "@main/db/import/utils.js";
import { getCurAccountDir } from "@main/paths.js";

vi.mock(import("@main/paths.js"), async () => ({
     getCurAccountDir: vi.fn(),
}));

describe("proto-msg-store", () => {
    let tmpCurAccountDir: string;

    beforeEach(() => {
        vi.clearAllMocks();
        tmpCurAccountDir = fs.mkdtempSync(path.join(os.tmpdir(), "proto-msg-store-"));
        vi.mocked(getCurAccountDir).mockReturnValue(tmpCurAccountDir);
    });

    afterEach(() => {
        clearPullStore();

        if (fs.existsSync(tmpCurAccountDir)) {
            fs.rmSync(tmpCurAccountDir, { recursive: true, force: true });
        }
    });

    it("reads back one empty PullResponse when the only response is lastBatch", async () => {
        const expectedResponses = [createPullResponse(1, true)];

        openPullWriterStream();
        await decodePullResp(expectedResponses[0]);

        await expect(collectPullResps()).resolves.toEqual(expectedResponses);
    });

    it("reads back three empty PullResponses when the final response is lastBatch", async () => {
        const expectedResponses = [
            createPullResponse(1, false),
            createPullResponse(2, false),
            createPullResponse(3, true),
        ];

        openPullWriterStream();
        for (const response of expectedResponses) {
            await decodePullResp(response);
        }

        await expect(collectPullResps()).resolves.toEqual(expectedResponses);
    });

    it("reads many PullResponses with changes when the final response is lastBatch", async () => {
        const time = Date.now();
        const payload = create(NotePayloadSchema, {
            createdAt: BigInt(time),
            updatedAt: BigInt(time),
            noteTypeId: generateUUIDV7(),
            fieldsJson: genLargeJson(1024 * 1024), // 1 MB
        });
        const resp1 = createPullResponse(1, false, 
            [create(SyncChangeSchema, {
            entityType: EntityType.NOTE,
            entityId: generateUUIDV7(),
            usn: BigInt(1),
            op: ChangeOp.UPSERT,
            payload: { case: "note", value: payload },
        })]
        );
        const resp2 = createPullResponse(2, true, [
            create(SyncChangeSchema, {
                entityType: EntityType.NOTE,
                entityId: generateUUIDV7(),
                usn: BigInt(3),
                op: ChangeOp.DELETE,
                deletedAt: BigInt(time),
            }),
            create(SyncChangeSchema, {
                entityType: EntityType.NOTE,
                entityId: generateUUIDV7(),
                usn: BigInt(4),
                op: ChangeOp.UPSERT,
                payload: { case: "note", value: payload },
            }),
            create(SyncChangeSchema, {
                entityType: EntityType.NOTE,
                entityId: generateUUIDV7(),
                usn: BigInt(5),
                op: ChangeOp.DELETE,
                deletedAt: BigInt(time),
            }),
        ]);

        const expectedResponses = [resp1, resp2];

        openPullWriterStream();
        for (const response of expectedResponses) {
            await decodePullResp(response);
        }

        await expect(collectPullResps()).resolves.toEqual(expectedResponses);
    });
});

function createPullResponse(batchSeq: number, lastBatch: boolean, changes?: SyncChange[]): PullResponse {
    return create(PullResponseSchema, {
        batchSeq,
        batchMaxUsn: BigInt(batchSeq),
        changes: changes,
        lastBatch,
    });
}

async function collectPullResps(): Promise<PullResponse[]> {
    const resps: PullResponse[] = [];

    for await (const response of readPullResps()) {
        resps.push(response);
    }

    return resps;
}

function genLargeJson(sizeInBytes: number): string {
    const baseString = "x";
    const repeatCount = Math.ceil(sizeInBytes / baseString.length);
    return baseString.repeat(repeatCount).slice(0, sizeInBytes);
}
