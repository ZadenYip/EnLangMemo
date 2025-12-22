import { Readable } from "stream";
import { removeDuplicateCue } from "./srt-cleaner";


describe('SRT Cleaner Tests', () => {
    it('should remove duplicate cues correctly', async () => {
        let cue1 = '1\r\n';
        cue1 += '00:00:01,000 --> 00:00:04,000\r\n';
        cue1 += 'Hello World\r\n';
        cue1 += '\r\n';
        let cue2 = '2\r\n';
        cue2 += '00:00:01,000 --> 00:00:04,000\r\n';
        cue2 += 'Hello World\r\n';
        cue2 += '\r\n';
        let cue3 = '3\r\n';
        cue3 += '00:00:05,000 --> 00:00:07,000\r\n';
        cue3 += 'Multiple\r\nLines\r\n';
        cue3 += '\r\n';
        let cue4 = '4\r\n';
        cue4 += '00:00:05,000 --> 00:00:07,000\r\n';
        cue4 += 'Multiple\r\nLines\r\n';
        cue4 += '\r\n';
        let cue5 = '5\r\n';
        cue5 += '00:00:08,000 --> 00:00:10,000\r\n';
        cue5 += 'Unique Cue\r\n';
        cue5 += '\r\n';

        const inputStream = Readable.from([cue1, cue2, cue3, cue4, cue5]);
        const outputChunks: string[] = [];
        const cleanerGenerator = removeDuplicateCue(inputStream);
        for await (const chunk of cleanerGenerator) {
            outputChunks.push(chunk);
        }
        expect(outputChunks.length).toBe(3);
        expect(outputChunks[0]).toBe(cue1);
        expect(outputChunks[1]).toBe(cue3.replace('3\r\n', '2\r\n'));
        expect(outputChunks[2]).toBe(cue5.replace('5\r\n', '3\r\n'));
    });

    it('should handle empty SRT files', async () => {
        const inputStream = Readable.from([]);
        const outputChunks: string[] = [];
        const cleanerGenerator = removeDuplicateCue(inputStream);
        for await (const chunk of cleanerGenerator) {
            outputChunks.push(chunk);
        }
        expect(outputChunks.length).toBe(0);
    });

    it('should not remove non-duplicate cues', async () => {
        let cue1 = '1\r\n';
        cue1 += '00:00:01,000 --> 00:00:04,000\r\n';
        cue1 += 'Hello World\r\n';
        cue1 += '\r\n';
        let cue2 = '2\r\n';
        cue2 += '00:00:05,000 --> 00:00:07,000\r\n';
        cue2 += 'Different Cue\r\n';
        cue2 += '\r\n';
        const inputStream = Readable.from([cue1, cue2]);
        const outputChunks: string[] = [];
        const cleanerGenerator = removeDuplicateCue(inputStream);
        for await (const chunk of cleanerGenerator) {
            outputChunks.push(chunk);
        }
        expect(outputChunks.length).toBe(2);
        expect(outputChunks[0]).toBe(cue1);
        expect(outputChunks[1]).toBe(cue2);
    });
    
});