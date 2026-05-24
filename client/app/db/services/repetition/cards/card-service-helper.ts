import { Card, IPreview, RecordLog, RecordLogItem, ReviewLog } from "ts-fsrs";
import { FSRSCard, FSRSIPreview, FSRSRecordLog, FSRSRecordLogItem, FSRSReviewLog } from "./card-service-types";
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

function calcElapsedDays(card: FSRSCard, config: CollectionConfig): number {
    if (card.lastReview === undefined) {
        return 0;
    }

    const currentReviewDay = toResetDayNumber(new Date(), config);
    const lastReviewDay = toResetDayNumber(card.lastReview, config);
    return Math.max(0, currentReviewDay - lastReviewDay);
}

function toResetDayNumber(date: Date, config: CollectionConfig): number {
    /** Date shifted so dailyResetTime becomes the review day boundary. */
    const shiftedDate = new Date(date.getTime() - config.dailyResetTime * 60 * 60 * 1000);
    /** Calendar date parts in the collection timezone after boundary shifting. */
    const parts = getTimeZoneDateParts(shiftedDate, config.timeZone);
    const oneDayInMs = 86_400_000;
    return Date.UTC(parts.year, parts.month - 1, parts.day) / oneDayInMs;
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
