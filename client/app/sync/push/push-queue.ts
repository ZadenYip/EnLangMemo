import { EntityType } from "@enlangmemo/sync-api";
import { getRepDb } from "@main/db/db.js";
import { cardsTable, collectionTable, decksTable, notesTable, noteTypesTable, processingNotesTable, reviewLogsTable, tombstonesTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm/sql/expressions/conditions";

export const TombstoneType = -1;
export type SyncEntityType = EntityType | typeof TombstoneType;
type CheckTable =
    | typeof collectionTable
    | typeof decksTable
    | typeof noteTypesTable
    | typeof processingNotesTable
    | typeof notesTable
    | typeof cardsTable
    | typeof reviewLogsTable
    | typeof tombstonesTable;
interface PendingEntityCheck {
    entityType: SyncEntityType;
    table: CheckTable;
}

export class PushQueue {
    private queue: SyncEntityType[] = [];

    private constructor() {}

    public static NewSyncQueue(): PushQueue {
        const pshQueue = new PushQueue();
        pshQueue.queue = createEntityQueue();
        return pshQueue;
    }

    public isEmpty(): boolean {
        return this.queue.length === 0;
    }

    public pop(): SyncEntityType | undefined {
        return this.queue.shift();
    }

    public peek(): SyncEntityType | undefined {
        return this.queue.length > 0 ? this.queue[0] : undefined;
    }
}

/**
 * Query sync entity tables and return pending entity types in fixed push order.
 * Tombstones are folded into their target entity type so DELETE-only entities are collected too.
 */
function createEntityQueue(): SyncEntityType[] {
    const checks: PendingEntityCheck[] = [
        { entityType: EntityType.COLLECTION, table: collectionTable },
        { entityType: EntityType.DECK, table: decksTable },
        { entityType: EntityType.NOTE_TYPE, table: noteTypesTable },
        { entityType: EntityType.NOTE, table: notesTable },
        { entityType: EntityType.PROCESSING_NOTE, table: processingNotesTable },
        { entityType: EntityType.CARD, table: cardsTable },
        { entityType: EntityType.REVIEW_LOG, table: reviewLogsTable },
        { entityType: TombstoneType, table: tombstonesTable },
    ];
    const queue: SyncEntityType[] = [];

    for (const check of checks) {
        if (hasUnsyncedChange(check.table)) {
            queue.push(check.entityType);
        }
    }

    return queue;
}

function hasUnsyncedChange(table: CheckTable): boolean {
    return getRepDb()
        .select({ usn: table.usn })
        .from(table)
        .where(eq(table.usn, -1))
        .limit(1)
        .get() !== undefined;
}
