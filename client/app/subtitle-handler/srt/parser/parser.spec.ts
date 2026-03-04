import { Readable } from "stream";
import { CueAST, Parser, TimestampAST } from "./parser";

describe('Subtitle Parser', () => {
    it('should parse cues correctly', async () => { 
        let subtitleData = '1\r\n00:00:01,000 --> 00:00:04,000\r\nHello World!\r\n';
        subtitleData += '\r\n'; // empty line between cues
        subtitleData += '2\r\n00:00:05,000 --> 00:00:08,000\r\nThis is a test.';    

        const expectedCues: CueAST[] = [
            new CueAST(1, 
                new TimestampAST(0, 0, 1, 0), 
                new TimestampAST(0, 0, 4, 0),   
                ['Hello World!']),
            new CueAST(2, 
                new TimestampAST(0, 0, 5, 0), 
                new TimestampAST(0, 0, 8, 0),   
                ['This is a test.'])
        ];

        await expectCueASTEqual(subtitleData, expectedCues);
    });

    it('should handle multi-line cue text', async () => { 
        let subtitleData = '1\r\n00:00:01,000 --> 00:00:04,000\r\n';
        subtitleData += 'Hello World!\r\nThis is line 2.\r\nAnd line 3.\r\n';
        subtitleData += '\r\n'; // empty line between cues
        subtitleData += '2\r\n00:00:05,000 --> 00:00:08,000\r\nSingle line cue.';    

        const expectedCues: CueAST[] = [
            new CueAST(1, 
                new TimestampAST(0, 0, 1, 0), 
                new TimestampAST(0, 0, 4, 0),   
                ['Hello World!', 'This is line 2.', 'And line 3.']),
            new CueAST(2, 
                new TimestampAST(0, 0, 5, 0), 
                new TimestampAST(0, 0, 8, 0),   
                ['Single line cue.'])
        ];

        await expectCueASTEqual(subtitleData, expectedCues);
    });

    it('should handle different line endings', async () => { 
        let subtitleData = '1\n00:00:01.000 --> 00:00:04.000\nHello World!\n\n';
        subtitleData += '2\r\n00:00:05.000 --> 00:00:08.000\r\nThis is a test.\r\n';
        const expectedCues: CueAST[] = [
            new CueAST(1, 
                new TimestampAST(0, 0, 1, 0), 
                new TimestampAST(0, 0, 4, 0),   
                ['Hello World!']),
            new CueAST(2, 
                new TimestampAST(0, 0, 5, 0), 
                new TimestampAST(0, 0, 8, 0),   
                ['This is a test.'])
        ];

        await expectCueASTEqual(subtitleData, expectedCues);
    });

    it('should handle unformatted cue text', async () => { 
        let subtitleData = '\r\n\r\n1\r\n00:00:01,000 --> 00:00:04,000\r\n<b>Hello World!</b>\r\n';
        subtitleData += '\r\n'; // empty line between cues
        subtitleData += '\r\n';
        subtitleData += '2\r\n00:00:05,000 --> 00:00:08,000\r\nThis is a <i>test</i>.\r\n\r\n';

        const expectedCues: CueAST[] = [
            new CueAST(1, 
                new TimestampAST(0, 0, 1, 0), 
                new TimestampAST(0, 0, 4, 0),   
                ['<b>Hello World!</b>']),
            new CueAST(2, 
                new TimestampAST(0, 0, 5, 0), 
                new TimestampAST(0, 0, 8, 0),   
                ['This is a <i>test</i>.'])
        ];

        await expectCueASTEqual(subtitleData, expectedCues);
    });

    it('should handle special token in text lines', async () => {
        let subtitleData = '1\r\n00:00:01,000 --> 00:00:04,000\r\nHello World!;,.-->\r\n';
        subtitleData += '\r\n';
        const expectedCues: CueAST[] = [
            new CueAST(1, 
                new TimestampAST(0, 0, 1, 0), 
                new TimestampAST(0, 0, 4, 0),   
                ['Hello World!;,.-->'])
        ];
        await expectCueASTEqual(subtitleData, expectedCues);
    });
});

async function expectCueASTEqual(subtitleData: string, expected: CueAST[]) {
    const input: Readable = Readable.from([subtitleData]);
    const parserStream: AsyncIterable<CueAST> = await Parser.createParser(input);
    const cues:CueAST[] = [];
    for await (const cue of parserStream) { 
        cues.push(cue);
    }
    expect(cues).toEqual(expected);
}