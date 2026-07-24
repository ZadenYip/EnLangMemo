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
