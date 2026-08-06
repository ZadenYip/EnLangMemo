// Review
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
import type { NoteTemplate } from "@main/db/services/repetition/note-template/nt-tpl-service-types";
import type { ColConfig } from "@main/db/services/repetition/collection/col-service-types";
import type { DeckConfig } from "@main/db/services/repetition/deck/deck-service-types";
import type { DicNoteMapping } from "@main/db/services/repetition/dic-note-mapping/dic-nt-mapping-types";
import { NoteField } from "@main/db/services/repetition/processing-note/pcs-note-types";


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
 * Collection 表 - 全局配置，只有一行
 * 存储应用级别的配置和同步状态
 */
export const collectionTable = sqliteTable("collection", {
    sqliteSchemaVersion: int("sqlite_schema_version").notNull(),
    lastSyncTime: int("last_sync_time").notNull().default(0),
    lastSyncUsn: int("sync_cursor_usn").notNull().default(0),
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
 * NoteTypes 表 - 笔记模板
 * 定义固定笔记字段和唯一卡片展示模板
 */
export const noteTypesTable = sqliteTable("note_types", {
    id: blob("id", { mode: "buffer" }).primaryKey(),
    name: text("name").notNull(),
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
        senseId: blob("sense_id", { mode: "buffer" }), // 释义追踪 ID
        sortField: text("sort_field"), // 用来排序的字段
        searchFields: text("search_fields"), // 所有字段值拼凑的搜索字符串
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
        senseId: blob("sense_id", { mode: "buffer" }),
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
 * ReviewLog 表 - 复习记录（不可变追加日志）
 */
export const reviewLogTable = sqliteTable(
    "review_log",
    {
        id: blob("id", { mode: "buffer" }).primaryKey(),
        cardId: blob("card_id", { mode: "buffer" }).notNull(),
        usn: int("usn").notNull(),
        reviewTime: int("review_time").notNull(), // 实际复习时间
        scheduledDays: int("scheduled_days").notNull(),
        rating: int("rating").notNull(), // 1=Again, 2=Hard, 3=Good, 4=Easy
        difficulty: real("difficulty").notNull(), // 复习后的难度
        stability: real("stability").notNull(), // 复习后的稳定性
        learningSteps: int("learning_steps").notNull(),
        state: int("state").notNull(),
        duration: int("duration").notNull(), // 停留耗时(ms)
    },
    (table) => [
        index("ix_review_log_usn").on(table.usn),
        index("ix_review_log_card_id").on(table.cardId),
    ],
);

/**
 * Tombstones 表 - 删除记录（对应 Anki 的 Grave）
 * 用于同步时追踪被删除的实体
 */
export const tombstonesTable = sqliteTable(
    "tombstones",
    {
        unitId: blob("unit_id", { mode: "buffer" }).primaryKey(), // 对应卡片、笔记、牌组或笔记模板的 UUID
        usn: int("usn").notNull(), // -1 表示本地删除
        deletedAt: int("deleted_at").notNull(), // 删除时间戳
        unitType: int("unit_type").notNull(), // 0=card, 1=note, 2=deck, 3=note_type, 4=processing_note
    },
    (table) => [index("ix_tombstones_usn").on(table.usn)],
);

// ================== Relations ==================

export const decksRelations = relations(decksTable, ({ many }) => ({
    cards: many(cardsTable),
}));

export const noteTypesRelations = relations(noteTypesTable, ({ many }) => ({
    notes: many(notesTable),
    processingNotes: many(processingNotesTable),
}));

export const notesRelations = relations(notesTable, ({ one, many }) => ({
    noteType: one(noteTypesTable, {
        fields: [notesTable.noteTypeId],
        references: [noteTypesTable.id],
    }),
    cards: many(cardsTable),
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
    reviewLogs: many(reviewLogTable),
}));

export const reviewLogRelations = relations(reviewLogTable, ({ one }) => ({
    card: one(cardsTable, {
        fields: [reviewLogTable.cardId],
        references: [cardsTable.id],
    }),
}));


