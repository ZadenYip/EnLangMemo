import { definitionsTable, examplesTable, wordPosesTable, wordsTable } from "./dic";

export type WordInsert = typeof wordsTable.$inferInsert;
export type WordPosInsert = typeof wordPosesTable.$inferInsert;
export type DefinitionInsert = typeof definitionsTable.$inferInsert;
export type ExampleInsert = typeof examplesTable.$inferInsert;
