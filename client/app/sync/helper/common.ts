import { getRepDb } from "@main/db/db.js";
import { reviewLogsTable, tombstonesTable, cardsTable, processingNotesTable, notesTable, noteTypesTable, decksTable, collectionTable } from "@main/db/schema/repetition/rep.js";
import { eq } from "drizzle-orm";
import { PendingLocalUsn } from "./usn.js";

export function toInt(usn: bigint): number {
    const value = Number(usn);
    if (!Number.isSafeInteger(value)) {
        throw new Error(`push response usn is outside JavaScript safe integer range: ${usn}`);
    }
    return value;
}

/**
 * @returns true if there are local changes that need to be synchronized with the server, false otherwise.
 */
export function hasLocalChanges(): boolean {
    const syncTables = [
        reviewLogsTable,
        tombstonesTable,
        cardsTable,
        processingNotesTable,
        notesTable,
        noteTypesTable,
        decksTable,
        collectionTable,
    ] as const;

    const repDb = getRepDb();
    for (const table of syncTables) {
        const changedRow = repDb
            .select({ usn: table.usn })
            .from(table)
            .where(eq(table.usn, PendingLocalUsn))
            .limit(1)
            .get();

        if (changedRow) {
            return true;
        }
    }

    return false;
}

