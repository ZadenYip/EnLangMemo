// CharReader.ts
import { Readable } from 'stream';

export class CharReader {
    private iterator: AsyncIterableIterator<any>;
    private buffer = ''; // buffer
    private ptr = 0;     // current read pointer position
    private isEOF = false;

    constructor(stream: Readable) {
        this.iterator = stream[Symbol.asyncIterator]();
    }

    /**
     * ensure buffer has at least `count` characters available from current pointer
     * if not enough, pull more from the stream
     * @param count - wanted available character count from current pointer
     */
    private async ensureAvailable(count: number): Promise<void> {
        // if buffer remaining length < count, pull more
        while ((this.buffer.length - this.ptr) < count) {
            if (this.isEOF) { break };

            const result = await this.iterator.next();
            if (result.done) {
                this.isEOF = true;
                break;
            }
            // Append the new chunk to the end of the buffer
            this.buffer += result.value.toString();
        }
    }

    /**
     * Peek at the next Nth character without moving the pointer.
     * peek(0) is the next character to read not currently at pointer.
     * peek(1) is the character after next.
     */
    public async peek(offset = 0): Promise<string | null> {
        // We need to ensure the buffer covers the position ptr + offset
        await this.ensureAvailable(offset + 1);

        const targetIndex = this.ptr + offset;
        if (targetIndex >= this.buffer.length) {
            return null; // Out of bounds, indicating EOF
        }
        return this.buffer[targetIndex];
    }

    /**
     * Read and consume the next character, moving the pointer forward.
     * @returns The consumed character, or null if end of file is reached.
     */
    public async next(): Promise<string | null> {
        await this.ensureAvailable(1);

        if (this.ptr >= this.buffer.length) {
            return null;
        }

        const char = this.buffer[this.ptr];
        this.ptr++;

        // 【Memory Optimization】Prevent buffer from growing indefinitely
        // Discard the already read part after processing more than 1KB of data
        if (this.ptr > 1024) {
            this.buffer = this.buffer.slice(this.ptr);
            this.ptr = 0;
        }

        return char;
    }
}