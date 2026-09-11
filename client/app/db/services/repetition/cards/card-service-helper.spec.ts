import { afterEach, describe, expect, it, vi } from "vitest";
import type { FSRSCard } from "./card-service-types.js";
import { TimeConfig } from "../shared/time.js";
import { toCard } from "./card-service-helper.js";

const shanghaiConfig: TimeConfig = {
    timeZone: "Asia/Shanghai",
    dailyResetTime: 4,
};

vi.mock(import("@main/db/db.js"), async () => {
    const mod = await import("@main/db/schema/repetition/rep.js");
    return {
        repetitionSchema: mod,
        getRepDb: vi.fn(),
    };
});

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
