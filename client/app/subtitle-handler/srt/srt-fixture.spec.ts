import { createReadStream, readFileSync } from "fs";
import { CueAST, Parser, TimestampAST } from "./parser/parser.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";


describe("SRT Fixture Tests", () => {
    it("should parse GBC-ED.srt correctly", async () => {
        const subtitleData = createReadStream(
            resolve(dirname(fileURLToPath(import.meta.url)), "./fixtures/GBC-ED.srt"),
            "utf-8"
        );

        const parserStream: AsyncIterable<CueAST> = Parser.createParser(subtitleData);
        const cues: CueAST[] = [];

        for await (const cue of parserStream) {
            cues.push(cue);
        }

        const expected: CueAST[] = await expectCueASTEqual("./fixtures/GBC-ED-expected.json");
        expect(cues).toEqual(expected);
    });
});

// convert JSON back to CueAST objects  
async function expectCueASTEqual(jsonPath: string) {
    const data = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), jsonPath), "utf-8");
    const rawExpected = JSON.parse(data);
    const expected: CueAST[] = rawExpected.map((c: any) => 
        new CueAST(
            c.sequence,
            new TimestampAST(c.startTime.hours, c.startTime.minutes, c.startTime.seconds, c.startTime.milliseconds),
            new TimestampAST(c.endTime.hours, c.endTime.minutes, c.endTime.seconds, c.endTime.milliseconds),
            c.textLines
        )
    );
    return expected;
}