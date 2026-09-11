import { Card, IPreview, RecordLog, RecordLogItem, ReviewLog, State } from "ts-fsrs";
import { CardQueue, FSRSCard, FSRSIPreview, FSRSRecordLog, FSRSRecordLogItem, FSRSReviewLog } from "./card-service-types.js";
import { calcElapsedDays } from "../shared/time.js";
import type { TimeConfig } from "../shared/time.js";

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

export function toCard(fsrsCard: FSRSCard, config: TimeConfig): Card {
    const elapsedDays = fsrsCard.lastReview
        ? calcElapsedDays(fsrsCard.lastReview, config.dailyResetTime, config.timeZone)
        : 0;
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
        elapsed_days: elapsedDays,
    }
    return card;
}

// TODO 似乎有点问题？
export function toCardQueue(card: FSRSCard): CardQueue {
    if (card.state === State.New) {
        return CardQueue.NEW;
    }
    if (card.state === State.Review) {
        return CardQueue.REVIEW;
    }
    return CardQueue.LEARNING;
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
