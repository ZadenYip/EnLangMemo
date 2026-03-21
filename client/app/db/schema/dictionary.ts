import {
    blob,
    index,
    int,
    sqliteTable,
    text,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const wordsTable = sqliteTable(
    'words',
    {
        wordId: blob('word_id', { mode: 'buffer' }).primaryKey(),
        spelling: text('spelling').notNull(),
        fingerprint: blob('fingerprint', { mode: 'buffer' }).notNull(),
        phoneticBre: text('phonetic_bre'),
        phoneticAme: text('phonetic_ame'),
        createdAt: int('created_at').notNull(),
        updatedAt: int('updated_at').notNull(),
    },
    (table) => [uniqueIndex('idx_words_spelling').on(table.spelling)],
);

export const wordPosesTable = sqliteTable(
    'word_poses',
    {
        poseId: blob('pose_id', { mode: 'buffer' }).primaryKey(),
        wordId: blob('word_id', { mode: 'buffer' })
            .notNull()
            .references(() => wordsTable.wordId, { onDelete: 'cascade' }),
        partOfSpeech: text('part_of_speech'),
        createdAt: int('created_at').notNull(),
        updatedAt: int('updated_at').notNull(),
    },
    (table) => [index('idx_word_poses_word_id').on(table.wordId)],
);

export const definitionsTable = sqliteTable(
    'definitions',
    {
        defId: blob('def_id', { mode: 'buffer' }).primaryKey(),
        wordPosId: blob('word_pos_id', { mode: 'buffer' })
            .notNull()
            .references(() => wordPosesTable.poseId, { onDelete: 'cascade' }),
        defSrc: text('def_src'),
        defTgt: text('def_tgt'),
        createdAt: int('created_at').notNull(),
        updatedAt: int('updated_at').notNull(),
    },
    (table) => [index('idx_definitions_word_pos_id').on(table.wordPosId)],
);

export const examplesTable = sqliteTable(
    'examples',
    {
        expId: blob('exp_id', { mode: 'buffer' }).primaryKey(),
        defId: blob('def_id', { mode: 'buffer' })
            .notNull()
            .references(() => definitionsTable.defId, { onDelete: 'cascade' }),
        exSrc: text('ex_src').notNull(),
        exTgt: text('ex_tgt'),
        createdAt: int('created_at').notNull(),
        updatedAt: int('updated_at').notNull(),
    },
    (table) => [index('idx_examples_def_id').on(table.defId)],
);

export const wordsRelations = relations(wordsTable, ({ many }) => ({
    poses: many(wordPosesTable),
}));

export const wordPosesRelations = relations(wordPosesTable, ({ one, many }) => ({
    wordId: one(wordsTable, {
        fields: [wordPosesTable.wordId],
        references: [wordsTable.wordId],
    }),
    definitions: many(definitionsTable),
}));

export const definitionsRelations = relations(definitionsTable, ({ one, many }) => ({
    wordPosId: one(wordPosesTable, {
        fields: [definitionsTable.wordPosId],
        references: [wordPosesTable.poseId],
    }),
    examples: many(examplesTable),
}));

export const examplesRelations = relations(examplesTable, ({ one }) => ({
    defId: one(definitionsTable, {
        fields: [examplesTable.defId],
        references: [definitionsTable.defId],
    }),
}));
