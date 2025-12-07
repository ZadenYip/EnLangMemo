// CharReader.ts
import { Readable } from 'stream';

export class CharReader {
    private iterator: AsyncIterableIterator<any>;
    private buffer: string = ''; // 内部暂存区
    private ptr: number = 0;     // 当前读取指针的位置
    private isEOF: boolean = false;

    constructor(stream: Readable) {
        this.iterator = stream[Symbol.asyncIterator]();
    }

    /**
     * 确保缓冲区里至少有 count 个字符可供读取（相对于当前指针）
     * 如果不够，就从流里拉取
     */
    private async ensureAvailable(count: number): Promise<void> {
        // 当 缓冲区剩余长度 < 需要的长度 时，继续拉取
        while ((this.buffer.length - this.ptr) < count) {
            if (this.isEOF) { break }; // 没数据了，直接退出

            const result = await this.iterator.next();
            if (result.done) {
                this.isEOF = true;
                break;
            }
            // 将新的 chunk 拼接到 buffer 尾部
            this.buffer += result.value.toString();
        }
    }

    /**
     * 偷看接下来的第 N 个字符，不移动指针。
     * peek(0) 是下一个要读的字符。
     * peek(1) 是下下个字符。
     */
    public async peek(offset: number = 0): Promise<string | null> {
        // 我们需要确保缓冲区里涵盖了 ptr + offset 这个位置
        await this.ensureAvailable(offset + 1);

        const targetIndex = this.ptr + offset;
        if (targetIndex >= this.buffer.length) {
            return null; // 越界了，说明是 EOF
        }
        return this.buffer[targetIndex];
    }

    /**
     * 读取并消费下一个字符，指针前移。
     * @returns 吃掉的字符，或者 null（如果到达文件末尾）
     */
    public async next(): Promise<string | null> {
        await this.ensureAvailable(1);

        if (this.ptr >= this.buffer.length) {
            return null;
        }

        const char = this.buffer[this.ptr];
        this.ptr++;

        // 【内存优化】防止 buffer 无限增长
        // 当处理了超过 1KB 数据后，丢弃已经读过的部分
        if (this.ptr > 1024) {
            this.buffer = this.buffer.slice(this.ptr);
            this.ptr = 0;
        }

        return char;
    }
}