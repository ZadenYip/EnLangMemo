import { CueAST, TimestampAST } from "./srt/parser/parser";


export function shiftTimestamp(shiftMs: Readonly<number>, timestamp: Readonly<TimestampAST>): TimestampAST {
    if (Number.isInteger(shiftMs)) {
        let totalMs = timestamp.totalMilliseconds + shiftMs;
        if (totalMs < 0) {
            totalMs = 0;
        }
        const hours = Math.floor(totalMs / 3600000);
        totalMs %= 3600000;
        const minutes = Math.floor(totalMs / 60000);
        totalMs %= 60000;
        const seconds = Math.floor(totalMs / 1000);
        const milliseconds = totalMs % 1000;
        return new TimestampAST(hours, minutes, seconds, milliseconds);
    } else {
        throw new Error("shiftMs must be an integer");
    }
}

export function shiftCue(shiftMs: Readonly<number>, cue: Readonly<CueAST>): CueAST {
    const shiftedStart = shiftTimestamp(shiftMs, cue.startTime);
    const shiftedEnd = shiftTimestamp(shiftMs, cue.endTime);
    return new CueAST(cue.sequence, shiftedStart, shiftedEnd, cue.textLines);
}