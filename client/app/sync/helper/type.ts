
export function toInt(usn: bigint): number {
    const value = Number(usn);
    if (!Number.isSafeInteger(value)) {
        throw new Error(`push response usn is outside JavaScript safe integer range: ${usn}`);
    }
    return value;
}
