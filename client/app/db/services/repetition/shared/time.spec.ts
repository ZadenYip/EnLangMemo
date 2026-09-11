import { describe, expect, it } from "vitest";
import { calcElapsedDays, getNextReviewDayStart } from "./time.js";

const shanghaiTimeZone = "Asia/Shanghai";
const dailyResetTime = 4;

vi.mock(import("@main/db/db.js"), async () => {
    const mod = await import("@main/db/schema/repetition/rep.js");
    return {
        repetitionSchema: mod,
        getRepDb: vi.fn(),
    };
});

/** Build a Date from an explicit Shanghai local datetime string. */
function fromShanghaiLocalTime(localDateTime: string): Date {
    return new Date(`${localDateTime}+08:00`);
}

describe("calcElapsedDays", () => {
    it("returns 1 when review-day starts are exactly 86400000ms apart", () => {
        const lastReviewTime = fromShanghaiLocalTime("2026-05-31T04:00:00");
        const now = fromShanghaiLocalTime("2026-06-01T04:00:00");

        const result = calcElapsedDays(lastReviewTime, dailyResetTime, shanghaiTimeZone, now);

        expect(result).toBe(1);
    });

    it("returns 1 when review-day starts are one day plus a little apart", () => {
        const lastReviewTime = fromShanghaiLocalTime("2026-05-31T04:00:00");
        const now = fromShanghaiLocalTime("2026-06-01T04:00:01");

        const result = calcElapsedDays(lastReviewTime, dailyResetTime, shanghaiTimeZone, now);

        expect(result).toBe(1);
    });
});

describe("getNextReviewDayStart", () => {
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

            const result = getNextReviewDayStart({
                dailyResetTime,
                timeZone: shanghaiTimeZone,
            }, now);

            expect(result).toBe(nextReset.getTime());
        },
    );
});
