/**
 * Result of importing a dictionary JSONL file, 
 * including the source file path, 
 * number of processed rows, 
 * and number of skipped rows.
 */
export interface ImportResult {
    source: string;
    total: number;
    processed: number;
    skipped: number;
    failed: number;
}