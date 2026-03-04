import { Readable } from "stream";
import { CueAST, Parser, TimestampAST } from "../parser/parser";

/**
 * Remove duplicate cues from an SRT file which have the same start time, end time, and text.
 * @param input - input
 * @return AsyncGenerator<string> yielding unique SRT cues as strings
 * example:
 * 1\r\n
 * 00:00:01,000 --> 00:00:04,000\r\n
 * This is a subtitle line.\r\n
 * \r\n
 */
export async function* removeDuplicateCue(input: Readable): AsyncGenerator<string> {
    const parserStream: AsyncIterable<CueAST> = Parser.createParser(input);

    let curLine = 1;

    const cueSet: Set<string> = new Set<string>();

    /**
     * The key consists of start time, end time, and text lines **without sequence number**.
     * @param cue 
     * @returns unique key string for the cue without sequence number
     */
    const cueKey = (cue: CueAST): string => {
        const start = formatTimestamp(cue.startTime);
        const end = formatTimestamp(cue.endTime);
        const text = cue.textLines.join('\r\n');
        return `${start}${end}${text}`;
    }

    for await (const cue of parserStream) {
        const key = cueKey(cue);
        if (cueSet.has(key)) {
            // duplicate cue, skip it
            continue;
        }
        cueSet.add(key);

        const rawSRTStr:string = convertCueToSRT(cue);
        // add sequence number line and empty line after each cue
        const srt:string = (curLine) + '\r\n' + rawSRTStr + '\r\n';
        yield srt;
        curLine += 1;
    }
}

function formatTimeNumber(value: number, pad: number): string {
    return value.toString().padStart(pad, '0');
}

function formatTimestamp(timestamp: TimestampAST): string {
    const hourStr = formatTimeNumber(timestamp.hours, 2);
    const minStr = formatTimeNumber(timestamp.minutes, 2);
    const secStr = formatTimeNumber(timestamp.seconds, 2);
    const milStr = formatTimeNumber(timestamp.milliseconds, 3);
    return `${hourStr}:${minStr}:${secStr},${milStr}`;
}

/**
 * 
 * @param cue - CueAST object
 * @returns cue to SRT formatted string without sequence number
 * example:
 * 
 * (do not have sequence number)
 * 00:00:01,000 --> 00:00:04,000\r\n
 * This is a subtitle line.\r\n
 */
function convertCueToSRT(cue: CueAST): string {
    const startTimeStr = formatTimestamp(cue.startTime);
    const timeArrow = '-->';
    const endTimeStr = formatTimestamp(cue.endTime);
    
    const textStr = cue.textLines.join('\r\n');
    return `${startTimeStr} ${timeArrow} ${endTimeStr}\r\n${textStr}\r\n`;
}
