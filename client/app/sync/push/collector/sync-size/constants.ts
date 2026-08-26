export const maxSyncBatchSize = 1024 * 64;

/** Smallest UUID sentinel used before collecting the first UUIDv7 row. */
export const zeroUuid: Buffer<ArrayBufferLike> = Buffer.alloc(16);

/**
 * Estimated maximum number of entities per sync batch, based on the server-side estimate.
 */
export const syncEntityLimits = {
    deck: 300,
    noteType: 64,
    note: 64,
    processingNote: 64,
    card: 400,
    reviewLog: 500,
    tombstone: 500,
} as const;

/** UUID decoded field size used by the server-side estimate. */
export const uuidSize = 16;

/** int64 decoded field size used by the server-side estimate. */
export const int64Size = 8;

/** int32 decoded field size used by the server-side estimate. */
export const int32Size = 4;

/** double decoded field size used by the server-side estimate. */
export const doubleSize = 8;

/** bool decoded field size used by the server-side estimate. */
export const boolSize = 1;

/**
 * Estimated decoded size for a deleted SyncChange, based on the server-side estimate.
 * entityId(UUID) + entityType(int32) + op(int32) + deletedAt(int64) + usn(int64)
 */
export const deletedChangeSize = uuidSize + int32Size + int32Size + int64Size + int64Size;
