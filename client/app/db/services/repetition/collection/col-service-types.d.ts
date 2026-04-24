
export interface CollectionConfig {
    /**
     * IANA
     */
    timeZone: string;
    /**
     * review reset time, 1 means 1:00 (24-hour format) reset
     */
    dailyResetTime: number;
    /**
     * epoch timestamp, in milliseconds, the time of the last scheduler reset
     */
    lastRolloverAt: number;
}
