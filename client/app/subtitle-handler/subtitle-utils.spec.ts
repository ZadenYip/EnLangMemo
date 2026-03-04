import { TimestampAST } from "./srt/parser/parser";
import { shiftTimestamp } from "./subtitle-utils";


describe('Subtitle Utils Tests', () => {
    
    it('should shift timestamp correctly', () => {
        // time: 00:01:00,000
        const originalTimestamp = new TimestampAST(0, 1, 0, 0);

        const shiftedTimestamp = shiftTimestamp(30000, originalTimestamp); // shift by 30 seconds
        const shiftedMillis = shiftedTimestamp.totalMilliseconds;
        expect(shiftedMillis).toBe(90000);

        expect(shiftedTimestamp.hours).toBe(0);
        expect(shiftedTimestamp.minutes).toBe(1);
        expect(shiftedTimestamp.seconds).toBe(30);
        expect(shiftedTimestamp.milliseconds).toBe(0);
    });

    it('should shift timestamp to zero if negative', () => {
        // time: 00:00:10,000
        const originalTimestamp = new TimestampAST(0, 0, 10, 0);

        // shift by -15 seconds
        const shiftedTimestamp = shiftTimestamp(-15000, originalTimestamp); 
        expect(shiftedTimestamp.totalMilliseconds).toBe(0);
        expect(shiftedTimestamp.hours).toBe(0);
        expect(shiftedTimestamp.minutes).toBe(0);
        expect(shiftedTimestamp.seconds).toBe(0);
        expect(shiftedTimestamp.milliseconds).toBe(0);
    });

    it('should borrow correctly across time units when shifting', () => {
        // time: 01:00:00,000
        const originalTimestamp = new TimestampAST(1, 0, 0, 0);
        // shift by -61 seconds
        const shiftedTimestamp = shiftTimestamp(-61000, originalTimestamp); 
        expect(shiftedTimestamp.totalMilliseconds).toBe(3539000);
        expect(shiftedTimestamp.hours).toBe(0);
        expect(shiftedTimestamp.minutes).toBe(58);
        expect(shiftedTimestamp.seconds).toBe(59);
        expect(shiftedTimestamp.milliseconds).toBe(0);
    });

    it('should carry correctly across time units when shifting', () => {
        // time: 00:59:59,500
        const originalTimestamp = new TimestampAST(0, 59, 59, 500);
        // shift by 1000 milliseconds
        const shiftedTimestamp = shiftTimestamp(500, originalTimestamp); 
        expect(shiftedTimestamp.totalMilliseconds).toBe(3600000);
        expect(shiftedTimestamp.hours).toBe(1);
        expect(shiftedTimestamp.minutes).toBe(0);
        expect(shiftedTimestamp.seconds).toBe(0);
        expect(shiftedTimestamp.milliseconds).toBe(0);
    });

    it('should throw error for non-integer shiftMs', () => {
        // time: 00:10:00,000
        const originalTimestamp = new TimestampAST(0, 10, 0, 0);
        expect(() => shiftTimestamp(1500.5, originalTimestamp)).toThrowError("shiftMs must be an integer");
    });
});
