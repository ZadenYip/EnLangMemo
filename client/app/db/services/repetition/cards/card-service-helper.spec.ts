import { afterEach, describe, expect, it, vi } from "vitest";
import { CollectionConfig } from "../collection/col-service-types";
import type { FSRSCard } from "./card-service-types";
import { getNextRstBoundaryTimestamp, toAssignedReviewDateRstTimestamp, toCard } from "./card-service-helper";

const shanghaiConfig: CollectionConfig = {
    timeZone: "Asia/Shanghai",
    dailyResetTime: 4,
    lastRolloverAt: 0,
};

function fromShanghaiLocalTime(localDateTime: string): Date {
    return new Date(`${localDateTime}+08:00`);
}

/** Build the minimum FSRS card shape needed by conversion tests. */
function createFSRSCard(lastReview: Date | undefined, due = fromShanghaiLocalTime("2026-06-01T04:00:00")): FSRSCard {
    return {
        difficulty: 0,
        stability: 0,
        scheduledDays: 0,
        due,
        lastReview,
        lapses: 0,
        learningSteps: 0,
        repetitions: 0,
        state: 0,
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe("toAssignedReviewDateRstTimestamp", () => {
    it.each([
        {
            shanghaiTime: "2026-05-31 03:52:21",
            expectedAssignedReviewDateRst: "2026-05-30 04:00:00",
        },
        {
            shanghaiTime: "2026-05-31 04:00:00",
            expectedAssignedReviewDateRst: "2026-05-31 04:00:00",
        },
        {
            shanghaiTime: "2026-05-31 04:01:00",
            expectedAssignedReviewDateRst: "2026-05-31 04:00:00",
        },
    ])(
        "assigns Shanghai time $shanghaiTime to reset boundary $expectedAssignedReviewDateRst",
        ({ shanghaiTime, expectedAssignedReviewDateRst }) => {
            const reviewTime = fromShanghaiLocalTime(shanghaiTime.replace(" ", "T"));
            const assignedReviewDateRst = fromShanghaiLocalTime(expectedAssignedReviewDateRst.replace(" ", "T"));

            const result = toAssignedReviewDateRstTimestamp(reviewTime, shanghaiConfig);

            expect(result).toBe(assignedReviewDateRst.getTime());
        },
    );
});

describe("toCard elapsed_days", () => {
    it("returns 0 when the card has not been reviewed", () => {
        vi.setSystemTime(fromShanghaiLocalTime("2026-06-01T10:00:00"));

        const result = toCard(createFSRSCard(undefined), shanghaiConfig);

        expect(result.elapsed_days).toBe(0);
    });

    it("returns 0 when the last review belongs to the current review day", () => {
        vi.setSystemTime(fromShanghaiLocalTime("2026-06-01T10:00:00"));

        const result = toCard(
            createFSRSCard(fromShanghaiLocalTime("2026-06-01T04:30:00")),
            shanghaiConfig,
        );

        expect(result.elapsed_days).toBe(0);
    });

    it("counts review days from reset boundary instead of midnight", () => {
        vi.setSystemTime(fromShanghaiLocalTime("2026-06-01T10:00:00"));
        
        const result = toCard(
            createFSRSCard(fromShanghaiLocalTime("2026-05-31T03:52:00")),
            shanghaiConfig,
        );

        expect(result.elapsed_days).toBe(2);
    });
});

describe("getNextResetBoundaryTimestamp", () => {
    it.each([
        {
            shanghaiNow: "2026-05-31 03:52:21",
            expectedNextReset: "2026-05-31 04:00:00",
        },
        {
            shanghaiNow: "2026-05-31 04:00:00",
            expectedNextReset: "2026-06-01 04:00:00",
        },
        {
            shanghaiNow: "2026-05-31 22:06:15",
            expectedNextReset: "2026-06-01 04:00:00",
        },
    ])(
        "returns next reset $expectedNextReset for Shanghai time $shanghaiNow",
        ({ shanghaiNow, expectedNextReset }) => {
            const now = fromShanghaiLocalTime(shanghaiNow.replace(" ", "T"));
            const nextReset = fromShanghaiLocalTime(expectedNextReset.replace(" ", "T"));

            const result = getNextRstBoundaryTimestamp(shanghaiConfig, now);

            expect(result).toBe(nextReset.getTime());
        },
    );
});
