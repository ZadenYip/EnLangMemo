import {
    blob,
    customType,
    index,
    int,
    real,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service-types.js";
import type { ColConfig } from "@main/db/services/repetition/collection/col-service-types.js";
import type { DeckConfig } from "@main/db/services/repetition/deck/deck-service-types.js";
import type { DicNoteMapping } from "@main/db/services/repetition/dic-note-mapping/dic-nt-mapping-types.js";
import { NoteField } from "@main/db/services/repetition/processing-note/pcs-note-types.js";


// More information see in https://dbdiagram.io/d/EnLangMemo-69aafcb1a3f0aa31e1146507

/**
 * Drizzle ORM does not have native JSONB support for SQLite
 * TData must be a json-serializable type, e.g. object
 */
const jsonb = <TData extends object>(str: string) =>
    customType<{ data: TData; driverData: string }>({
        // sqlite type
        dataType() {
            return "jsonb";
        },
        // write to database by stringifying JSON
        toDriver(value: TData): string {
            return JSON.stringify(value);
        },
        // read from database and parse JSON
        fromDriver(value: string): TData {
            return JSON.parse(value);
        },
    })(str);

/**
 * Collection table: global config, expected to contain exactly one row.
 * Stores app-level config and sync state.
 */
export const collectionTable = sqliteTable("collection", {
    id: blob("id", { mode: "buffer" }).primaryKey(),
    sqliteSchemaVersion: int("sqlite_schema_version").notNull(),
    lastSyncTime: int("last_sync_time").notNull().default(0),
    syncCursorUsn: int("sync_cursor_usn").notNull().default(0),
    usn: int("usn").notNull(),
    createdAt: int("created_at").notNull(),
    updatedAt: int("updated_at").notNull(),
    /**
     * see app/db/services/repetition/collection/col-service-types.ts
     * CollectionConfig
     */
    config: jsonb<ColConfig>("config").notNull(),
});

/**
 * Decks
 */
export const decksTable = sqliteTable("decks", {
    id: blob("id", { mode: "buffer" }).primaryKey(),
    usn: int("usn").notNull(),
    name: text("name").notNull(),
    updatedAt: int("updated_at").notNull(),
    newCardsPerDay: int("new_cards_per_day").notNull().default(20),
    newLearnedToday: int("new_learned_today").notNull().default(0),
    learnedToday: int("learned_today").notNull().default(0),
    reviewedToday: int("reviewed_today").notNull().default(0),
    /**
     * 
     */
    config: jsonb<DeckConfig>("config").notNull(),
});

/**
 * Note types table: note templates.
 * Defines fixed note fields and the single card rendering template.
 */
export const noteTypesTable = sqliteTable("note_types", {
    id: blob("id", { mode: "buffer" }).primaryKey(),
    name: text("name").notNull(),
    /**
     * Official preset template id used for analytics and server-side training data grouping.
     */
    presetTemplateId: int("preset_template_id").notNull().default(0),
    usn: int("usn").notNull(),
    updatedAt: int("updated_at").notNull(),
    /**
      "css": "CSS content",
      "sortField": timestamp,
      "fields": [{"id": timestamp, "name": "TargetWord"}], 
      "front": "{{TargetWord}}", 
      "back": "xxx"
     */
    noteTemplate: jsonb<NoteTemplate>("note_template").notNull(),
});

/**
 * Dictionary add-card mapping config, currently only one row is supported.
 */
export const dicNoteMapTable = sqliteTable("dic_note_map", {
    mapId: blob("map_id", { mode: "buffer" }).primaryKey(),
    noteTypeId: blob("note_type_id", { mode: "buffer" })
        .notNull()
        .references(() => noteTypesTable.id, { onDelete: "cascade" }),
    usn: int("usn").notNull(),
    mapping: jsonb<DicNoteMapping>("mapping").notNull(),
});

export const notesTable = sqliteTable(
    "notes",
    {
        id: blob("id", { mode: "buffer" }).primaryKey(),
        noteTypeId: blob("note_type_id", { mode: "buffer" })
            .notNull(),
        usn: int("usn").notNull(),
        createdAt: int("created_at").notNull(),
        updatedAt: int("updated_at").notNull(),
        senseId: int("sense_id"), // Definition tracking ID, linked to official dictionary definitions.def_id.
        sortField: text("sort_field"), // Field used for sorting.
        searchFields: text("search_fields"), // Search string built from all field values.
        fields: jsonb<NoteField[]>("fields").notNull(), // JSON: [{"TargetWord": "Apple"}, {...}]
    },
    (table) => [index("ix_notes_usn").on(table.usn)],
);

export const processingNotesTable = sqliteTable(
    "processing_notes",
    {
        id: blob("id", { mode: "buffer" }).primaryKey(),
        noteTypeId: blob("note_type_id", { mode: "buffer" }).notNull(),
        usn: int("usn").notNull(),
        createdAt: int("created_at").notNull(),
        updatedAt: int("updated_at").notNull(),
        senseId: int("sense_id"),
        fields: jsonb<NoteField[]>("fields").notNull(),
    },
    (table) => [index("ix_processing_usn").on(table.usn)],
);

export const cardsTable = sqliteTable(
    "cards",
    {
        id: blob("id", { mode: "buffer" }).primaryKey(),
        noteId: blob("note_id", { mode: "buffer" })
            .notNull(),
        deckId: blob("deck_id", { mode: "buffer" })
            .notNull(),
        usn: int("usn").notNull(),
        updatedAt: int("updated_at").notNull(),
        difficulty: real("difficulty").notNull(),
        stability: real("stability").notNull(),
        scheduledDays: int("scheduled_days").notNull(),
        /**
         * Due timestamp in milliseconds.
         * - new: card introduction ordering timestamp
         * - learning/relearning: exact due timestamp
         * - review: FSRS due timestamp
         */
        due: int("due").notNull(),
        lastReview: int("last_review"),
        lapses: int("lapses").notNull(),
        learningSteps: int("learning_steps").notNull(),
        repetitions: int("repetitions").notNull(),
        state: int("state").notNull(),
        /**
         * -1 = suspended, 0 = new, 1 = learning/relearning, 2 = review.
         * Use state to distinguish learning and relearning.
         */
        queue: int("queue").notNull(),
    },
    (table) => [
        index("ix_cards_sched").on(table.deckId, table.queue, table.due),
        index("ix_cards_usn").on(table.usn),
        index("ix_cards_nid").on(table.noteId),
    ],
);

/**
 * Review log table: immutable append-only review history.
 */
export const reviewLogsTable = sqliteTable(
    "review_logs",
    {
        id: blob("id", { mode: "buffer" }).primaryKey(),
        cardId: blob("card_id", { mode: "buffer" }).notNull(),
        usn: int("usn").notNull(),
        reviewTime: int("review_time").notNull(), // Actual review time.
        scheduledDays: int("scheduled_days").notNull(),
        rating: int("rating").notNull(), // 1=Again, 2=Hard, 3=Good, 4=Easy
        difficulty: real("difficulty").notNull(), // Post-review difficulty.
        stability: real("stability").notNull(), // Post-review stability.
        learningSteps: int("learning_steps").notNull(),
        state: int("state").notNull(),
        duration: int("duration").notNull(), // Time spent in milliseconds.
    },
    (table) => [
        index("ix_review_logs_usn").on(table.usn),
        index("ix_review_logs_card_id").on(table.cardId),
    ],
);

/**
 * Tombstones table: deletion records, equivalent to Anki graves.
 * Tracks deleted entities for sync.
 */
export const tombstonesTable = sqliteTable(
    "tombstones",
    {
        unitId: blob("unit_id", { mode: "buffer" }).primaryKey(), // UUID of the synced entity.
        usn: int("usn").notNull(), // PendingLocalUsn means locally deleted and pending push.
        deletedAt: int("deleted_at").notNull(), // Deletion timestamp.
        unitType: int("unit_type").notNull(), // 0=unspecified, 1=collection, 2=deck, 3=note_type, 4=note, 5=processing_note, 6=card, 7=review_log
    }
);

// ================== Relations ==================

export const decksRelations = relations(decksTable, ({ many }) => ({
    cards: many(cardsTable),
}));

export const noteTypesRelations = relations(noteTypesTable, ({ many }) => ({
    notes: many(notesTable),
    processingNotes: many(processingNotesTable),
}));

export const notesRelations = relations(notesTable, ({ one }) => ({
    noteType: one(noteTypesTable, {
        fields: [notesTable.noteTypeId],
        references: [noteTypesTable.id],
    }),
    cards: one(cardsTable),
}));

export const processingNotesRelations = relations(
    processingNotesTable,
    ({ one }) => ({
        noteType: one(noteTypesTable, {
            fields: [processingNotesTable.noteTypeId],
            references: [noteTypesTable.id],
        })
    }),
);

export const cardsRelations = relations(cardsTable, ({ one, many }) => ({
    note: one(notesTable, {
        fields: [cardsTable.noteId],
        references: [notesTable.id],
    }),
    deck: one(decksTable, {
        fields: [cardsTable.deckId],
        references: [decksTable.id],
    }),
    reviewLogs: many(reviewLogsTable),
}));

export const reviewLogRelations = relations(reviewLogsTable, ({ one }) => ({
    card: one(cardsTable, {
        fields: [reviewLogsTable.cardId],
        references: [cardsTable.id],
    }),
}));


