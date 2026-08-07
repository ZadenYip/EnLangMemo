import Logger from "electron-log/main";
import { v7 as uuidv7 } from "uuid";

export function generateUUIDV7(): Buffer {
    const uuidBuffer = Buffer.alloc(16);
    uuidv7({ msecs: Date.now() }, uuidBuffer);
    Logger.info("Generated UUIDv7", {
        uuid: uuidBuffer.toString("hex"),
    });
    return uuidBuffer;
}

/**
 * Converts a standard UUID string to a 16-byte buffer.
 * @param uuid - a standard UUID string (e.g., "123e4567-e89b-12d3-a456-426614174000")
 * @returns - a 16-byte buffer representing the UUID
 */
export function uuidToBuffer(uuid: string): Buffer {
    return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

/**
 * Converts a hexadecimal string to a bytes buffer.
 * @param value - hexadecimal value
 * @returns bytes buffer
 */
export function hexToBuffer(value: string): Buffer {
    return Buffer.from(value, "hex");
}

/**
 * Converts a bytes buffer to a hexadecimal string.
 * @param value - bytes buffer
 * @returns hexadecimal string
 */
export function bufferToHex(value: Buffer): string {
    return value.toString("hex");
}
