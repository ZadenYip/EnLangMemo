/**
 * Collection Config
 */
export interface ColConfig {
    /**
     * IANA time zone used by scheduler review-day boundaries.
     */
    timeZone: string;
    /**
     * Review reset hour in 24h format; 4 means 04:00.
     */
    dailyResetTime: number;
}
