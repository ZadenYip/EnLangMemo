import { getRepDb } from "@main/db/db.js";
import { bufferToHex, generateUUIDV7, hexToBuffer } from "@main/db/import/utils.js";
import { dicNoteMapTable, noteTypesTable } from "@main/db/schema/repetition/rep.js";
import {
    DicNoteMapWithNoteType,
} from "./dic-nt-mapping-types.js";
import { IDicNoteMappingService } from "./dic-nt-mapping-service-interface.js";
import { eq } from "drizzle-orm";
import Logger from "electron-log/main.js";
import { PendingLocalUsn } from "@main/sync/helper/usn.js";

/**
 * Service for the single dictionary note mapping config.
 */
export class DicNoteMappingService implements IDicNoteMappingService {
    /**
     * Get current dictionary note mapping config.
     */
    async getMappingConfig(): Promise<DicNoteMapWithNoteType | null> {
        const row = await getRepDb().query.dicNoteMapTable.findFirst();
        if (!row) {
            return null;
        }

        // check if the referenced note type still exists
        const noteTypeRow = await getRepDb().query.noteTypesTable.findFirst({
            where: eq(noteTypesTable.id, row.noteTypeId),
        });
        if (!noteTypeRow) {
            // delete the invalid mapping config
            await getRepDb().delete(dicNoteMapTable).where(eq(dicNoteMapTable.mapId, row.mapId));
            return null;
        }

        const result: DicNoteMapWithNoteType = {
            noteTypeId: bufferToHex(row.noteTypeId),
            dicNoteMapping: row.mapping,
        };

        return result;
    }

    /**
     * Save current dictionary note mapping config.
     */
    async saveMappingConfig(config: DicNoteMapWithNoteType): Promise<void> {
        const existingRow = await getRepDb().query.dicNoteMapTable.findFirst();
        const noteTypeId = hexToBuffer(config.noteTypeId);
        
        if (existingRow) {
            await getRepDb().update(dicNoteMapTable).set({
                noteTypeId,
                usn: PendingLocalUsn,
                mapping: config.dicNoteMapping,
            }).where(eq(dicNoteMapTable.mapId, existingRow.mapId));
            Logger.info(`Updated dictionary note mapping config for noteTypeId ${config.noteTypeId}`);
        } else {
            await getRepDb().insert(dicNoteMapTable).values({
                mapId: generateUUIDV7(),
                noteTypeId,
                usn: PendingLocalUsn,
                mapping: config.dicNoteMapping,
            });
            Logger.info(`Inserted new dictionary note mapping config for noteTypeId ${config.noteTypeId}`);
        }
    }

}
