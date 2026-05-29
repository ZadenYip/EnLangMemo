import { Card, IPreview, RecordLog, RecordLogItem, ReviewLog, State } from "ts-fsrs";
import { CARD_QUEUE, CardQueue, FSRSCard, FSRSIPreview, FSRSRecordLog, FSRSRecordLogItem, FSRSReviewLog } from "./card-service-types";
import { CollectionConfig } from "../collection/col-service-types";

export function createEmptyCardHandler(card: Card): FSRSCard {
    const result: FSRSCard = toFSRSCard(card);
    return result;
}

function toFSRSCard(card: Card): FSRSCard {
    const fsrsCard: FSRSCard = {
        difficulty: card.difficulty,
        stability: card.stability,
        scheduledDays: card.scheduled_days,
        due: card.due,
        lastReview: card.last_review,
        lapses: card.lapses,
        learningSteps: card.learning_steps,
        repetitions: card.reps,
        state: card.state,
    }
    return fsrsCard;
}

export function toCard(fsrsCard: FSRSCard, config: CollectionConfig): Card {
    const card: Card = {
        difficulty: fsrsCard.difficulty,
        stability: fsrsCard.stability,
        scheduled_days: fsrsCard.scheduledDays,
        due: fsrsCard.due,
        last_review: fsrsCard.lastReview,
        lapses: fsrsCard.lapses,
        learning_steps: fsrsCard.learningSteps,
        reps: fsrsCard.repetitions,
        state: fsrsCard.state,
        elapsed_days: calcElapsedDays(fsrsCard, config),
    }
    return card;
}
/**
 * Get the next review reset boundary after the given timestamp.
 * This is used as the upper due bound for "today's" learning/review cards.
 * Example when dailyResetTime = 4:
 * - 2026-05-31 03:52 -> 2026-05-31 04:00.
 * - 2026-05-31 22:06 -> 2026-06-01 04:00.
 * - 2026-05-31 04:00 -> 2026-06-01 04:00.
 * @returns Epoch timestamp in milliseconds for the next reset boundary.
 */
export function getNextRstBoundaryTimestamp(config: CollectionConfig, now = new Date()): number {
    const oneDayInMs = 86_400_000;
    return toAssignedReviewDateRstTimestamp(new Date(now.getTime() + oneDayInMs), config);
}

function calcElapsedDays(card: FSRSCard, config: CollectionConfig): number {
    if (card.lastReview === undefined) {
        return 0;
    }

    const oneDayInMs = 86_400_000;
    const currentReviewDateRst = toAssignedReviewDateRstTimestamp(new Date(), config);
    const lastReviewDateRst = toAssignedReviewDateRstTimestamp(card.lastReview, config);
    /** Milliseconds between the current review day and the card's last review day. */
    const elapsedMs = currentReviewDateRst - lastReviewDateRst;
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
export function toAssignedReviewDateRstTimestamp(date: Date, config: CollectionConfig): number {
    const shiftedDate = new Date(date.getTime() - config.dailyResetTime * 60 * 60 * 1000);
    /** Calendar date parts in the collection timezone after review-day shifting. */
    const dateParts = getTimeZoneDateParts(shiftedDate, config.timeZone);
    /** Reset boundary that wrongly treats the collection timezone's reset time as UTC. */
    const fakeUtcRstTimestamp = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, config.dailyResetTime);
    /** Local date-time parts of the fake UTC reset time in the collection timezone. */
    const fakeUtcRstInTimeZoneParts = getTimeZoneDateTimeParts(new Date(fakeUtcRstTimestamp), config.timeZone);
    /** The same displayed local time rebuilt as UTC, used only to calculate timezone offset. */
    const fakeUtcRstInTimeZoneTimestamp = Date.UTC(
        fakeUtcRstInTimeZoneParts.year,
        fakeUtcRstInTimeZoneParts.month - 1,
        fakeUtcRstInTimeZoneParts.day,
        fakeUtcRstInTimeZoneParts.hour,
        fakeUtcRstInTimeZoneParts.minute,
        fakeUtcRstInTimeZoneParts.second,
    );
    /** Timezone offset in milliseconds at this reset boundary. */
    const timeZoneOffsetMs = fakeUtcRstInTimeZoneTimestamp - fakeUtcRstTimestamp;
    return fakeUtcRstTimestamp - timeZoneOffsetMs;
}

function getTimeZoneDateParts(date: Date, timeZone: string) {
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

function getTimeZoneDateTimeParts(date: Date, timeZone: string) {
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

export function repeatHandler(preview: IPreview): FSRSIPreview {
    const result: FSRSIPreview = toFSRSIPreview(preview);
    return result;
}

export function nextHandler(recordLog: RecordLogItem): FSRSRecordLogItem {
    const result = toFSRSRecordLogItem(recordLog);
    return result;
}

function toFSRSReviewLog(reviewLog: ReviewLog) {
    const mid: FSRSReviewLog = {
        reviewTime: reviewLog.review,
        scheduledDays: reviewLog.scheduled_days,
        rating: reviewLog.rating,
        difficulty: reviewLog.difficulty,
        stability: reviewLog.stability,
        learningSteps: reviewLog.learning_steps,
        state: reviewLog.state,
    }
    return mid;
}

function toFSRSRecordLogItem(recordLog: RecordLogItem) {
    const card = toFSRSCard(recordLog.card);
    const log = toFSRSReviewLog(recordLog.log);
    const item: FSRSRecordLogItem = {
        card,
        log,
    };
    return item;
}

function toFSRSRecordLog(recordLog: RecordLog): FSRSRecordLog {
    const result: FSRSRecordLog = {
        "1": toFSRSRecordLogItem(recordLog[1]),
        "2": toFSRSRecordLogItem(recordLog[2]),
        "3": toFSRSRecordLogItem(recordLog[3]),
        "4": toFSRSRecordLogItem(recordLog[4]),
    };
    return result;
}

function toFSRSIPreview(preview: IPreview): FSRSIPreview {
    const recordLog = toFSRSRecordLog(preview);
    const result: FSRSIPreview = {
        ...recordLog,
        *[Symbol.iterator](): IterableIterator<FSRSRecordLogItem> {
            yield recordLog[1];
            yield recordLog[2];
            yield recordLog[3];
            yield recordLog[4];
        },
    };
    return result;
}
