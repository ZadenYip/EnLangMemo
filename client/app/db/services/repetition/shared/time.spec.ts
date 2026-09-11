import { describe, expect, it } from "vitest";
import { calcElapsedDays } from "./time.js";

const shanghaiTimeZone = "Asia/Shanghai";
const dailyResetTime = 4;

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
