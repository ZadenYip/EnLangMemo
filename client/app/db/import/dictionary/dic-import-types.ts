/**
 * Result of importing a dictionary JSONL file,
 * including the source file path,
 * number of processed rows,
 * and number of skipped rows.
 */
export interface ImportResult {
    /**
     * -1 for error for reading the file
     */
    total: number;

    /**
     * Number of rows successfully processed and upserted into the database
     */
    processed: number;
    /**
     * Number of rows that were skipped during the import process
     */
    skipped: number;
    /**
     * Number of rows that failed to be imported
     */
    failed: number;
}

export interface DicImpResult {
    /** Aggregate result across every typed section in dictionary.jsonl. */
    total: ImportResult;
    /** Result for rows with type = 0. */
    words: ImportResult;
    /** Result for rows with type = 1. */
    wordPoses: ImportResult;
    /** Result for rows with type = 2. */
    definitions: ImportResult;
    /** Result for rows with type = 3. */
    examples: ImportResult;
}

export interface DicImpProgress {
    /** Current import progress percentage used by the renderer progress bar. */
    progress: number;
    /** Current dictionary section being imported from the typed JSONL file. */
    stage: "words" | "wordPoses" | "definitions" | "examples" | "completed";
    /** Final import result, only available when progress reaches 100%. */
    result?: DicImpResult;
}
