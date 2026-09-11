
import { getRepDb } from "@main/db/db.js";
import { collectionTable } from "@main/db/schema/repetition/rep.js";

/** Collection time settings used by review-day boundary calculations. */
export interface TimeConfig {
    /** Review reset hour in 24h format; 4 means 04:00. */
    dailyResetTime: number;
    /** IANA time zone used by scheduler review-day boundaries. */
    timeZone: string;
}

export function getTimeConfig(): TimeConfig {
    const timeConfig = getRepDb()
        .select({
            dailyResetTime: collectionTable.dailyResetTime,
            timeZone: collectionTable.timeZone,
        })
        .from(collectionTable)
        .get();
    if (!timeConfig) {
        throw new Error("Collection time config not found.");
    }

    return timeConfig;
}

export function calcElapsedDays(time: Date, dailyResetTime: number, timeZone: string, now = new Date()): number {
    const oneDayInMs = 86400000;
    const curReviewDateRst = toReviewDayStart(now, dailyResetTime, timeZone);
    const lastReviewDateRst = toReviewDayStart(time, dailyResetTime, timeZone);
    
    /** Milliseconds between the current review day and the card's last review day. */
    const elapsedMs = curReviewDateRst - lastReviewDateRst;
    if (elapsedMs <= 0) {
        return 0;
    }

    return Math.round(elapsedMs / oneDayInMs);
}
/**
 * Convert a timestamp to the reset boundary of the review date it belongs to.
 * The app's review date starts at dailyResetTime in the collection timezone.
 * Example when dailyResetTime = 4:
 * - 2026-05-31 03:52 belongs to 2026-05-30, returns 2026-05-30 04:00.
 * - 2026-05-31 04:01 belongs to 2026-05-31, returns 2026-05-31 04:00.
 * @returns Epoch timestamp in milliseconds of the assigned review date's reset boundary.
 */

export function toReviewDayStart(date: Date, dailyResetTime: number, timeZone: string): number {
    const shiftedDate = new Date(date.getTime() - dailyResetTime * 60 * 60 * 1000);
    /** Calendar date parts in the collection timezone after review-day shifting. */
    const dateParts = getTimeZoneDateParts(shiftedDate, timeZone);
    /** Reset boundary that wrongly treats the collection timezone's reset time as UTC. */
    const fakeUtcRstTimestamp = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, dailyResetTime);
    /** Local date-time parts of the fake UTC reset time in the collection timezone. */
    const fakeUtcRstInTimeZoneParts = getTimeZoneDateTimeParts(new Date(fakeUtcRstTimestamp), timeZone);
    /** The same displayed local time rebuilt as UTC, used only to calculate timezone offset. */
    const fakeUtcRstInTimeZoneTimestamp = Date.UTC(
        fakeUtcRstInTimeZoneParts.year,
        fakeUtcRstInTimeZoneParts.month - 1,
        fakeUtcRstInTimeZoneParts.day,
        fakeUtcRstInTimeZoneParts.hour,
        fakeUtcRstInTimeZoneParts.minute,
        fakeUtcRstInTimeZoneParts.second
    );
    /** Timezone offset in milliseconds at this reset boundary. */
    const timeZoneOffsetMs = fakeUtcRstInTimeZoneTimestamp - fakeUtcRstTimestamp;
    return fakeUtcRstTimestamp - timeZoneOffsetMs;
}

export function getTimeZoneDateParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat("zh-CN", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    return {
        year: Number(parts.find((part) => part.type === "year")!.value),
        month: Number(parts.find((part) => part.type === "month")!.value),
        day: Number(parts.find((part) => part.type === "day")!.value),
    };
}

export function getTimeZoneDateTimeParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat("zh-CN", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    return {
        year: Number(parts.find((part) => part.type === "year")!.value),
        month: Number(parts.find((part) => part.type === "month")!.value),
        day: Number(parts.find((part) => part.type === "day")!.value),
        hour: Number(parts.find((part) => part.type === "hour")!.value),
        minute: Number(parts.find((part) => part.type === "minute")!.value),
        second: Number(parts.find((part) => part.type === "second")!.value),
    };
}
/**
 * Get the next review-day start after the given timestamp.
 * This is used as the upper due bound for "today's" learning/review cards.
 * Example when dailyResetTime = 4:
 * - 2026-05-31 03:52 -> 2026-05-31 04:00.
 * - 2026-05-31 22:06 -> 2026-06-01 04:00.
 * - 2026-05-31 04:00 -> 2026-06-01 04:00.
 * @returns Epoch timestamp in milliseconds for the next review-day start.
 */

export function getNextReviewDayStart(config: TimeConfig, now = new Date()): number {
    const oneDayInMs = 86400000;
    return toReviewDayStart(new Date(now.getTime() + oneDayInMs), config.dailyResetTime, config.timeZone);
}

