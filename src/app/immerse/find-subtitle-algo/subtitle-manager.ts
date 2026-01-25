import { GlobalSubtitle } from "../subtitle-interface";
import { IntervalTree } from "./interval-tree";

export class SubtitleManager {
    private nextActiveIndex: number = 0;
    private subtitleList: GlobalSubtitle[];
    private subtitleTree: IntervalTree<number, GlobalSubtitle>;

    constructor(emptyTip?: string) {
        const textLines = emptyTip ? [emptyTip] : [];
        const sentinelValue: GlobalSubtitle = {
            id: -1,
            startTime: -1,
            endTime: -1,
            textLines: [],
        };

        if (emptyTip) {
            sentinelValue.textLines = textLines;
            this.subtitleList = [ sentinelValue ];
        } else {
            this.subtitleList = [];
        }
        this.subtitleTree = new IntervalTree<number, GlobalSubtitle>(
            -1,
            sentinelValue,
            (a, b) => a - b,
        );
    }

    public get subtitles() : GlobalSubtitle[] {
        return this.subtitleList;
    }
    

    public add(subtitle: GlobalSubtitle): void {
        // reassign ID based on current length for tracking
        subtitle.id = this.subtitleList.length;
        this.subtitleList.push(subtitle);
        this.subtitleTree.insert(
            subtitle.startTime,
            subtitle.endTime,
            subtitle,
        );
    }
    
    /**
     * linear scan from last active index to find all overlapping subtitles
     * @param time - current video time in milliseconds
     * @returns set of active subtitle IDs
     */
    public nextSubtitleIds(time: number): Set<number> {
        let activeSubtitleIDs: Set<number> = new Set();

        if (this.nextActiveIndex < this.subtitleList.length) {
            const currentSubtitle = this.subtitleList[this.nextActiveIndex];
            if (this.isOverlapping(currentSubtitle, time)) {
                activeSubtitleIDs.add(currentSubtitle.id);
                this.nextActiveIndex++;
                return activeSubtitleIDs;
            } else if (time > currentSubtitle.startTime) {
                // current subtitle is past, need to use interval tree search
                const subtitlesIDArray = this.findSubtitleAtTime(time);
                subtitlesIDArray.forEach(id => activeSubtitleIDs.add(id));
                this.nextActiveIndex = subtitlesIDArray.length > 0 ? subtitlesIDArray.at(-1)! + 1 : this.nextActiveIndex;
            }
        }
        
        return activeSubtitleIDs;
    }

    /**
     * 
     * @param time - time in milliseconds
     * @returns array of active subtitle IDs
     */
    private findSubtitleAtTime(time: number): Array<number> {
        const subtitleIDs: Array<number> = [];
        const value = this.subtitleTree.search(time, time);

        if (!value) {
            return subtitleIDs;
        }

        const earliestSubtitleID = this.earliestOverlappingSubtitle(value.id, time);
        const oldestSubtitleID = this.oldestOverlappingSubtitle(value.id, time);

        for (let i = earliestSubtitleID; i <= oldestSubtitleID; i++) {
            subtitleIDs.push(i);
        }

        return subtitleIDs;
    }

    private earliestOverlappingSubtitle(index: number, time: number): number {
        const startingSubtitle = this.subtitleList[index];
        let earliestSubtitle = startingSubtitle;
        let subtitle = this.subtitleList.at(earliestSubtitle.id - 1);
        while (subtitle!.startTime <= earliestSubtitle.startTime && this.isOverlapping(subtitle!, time)) {
            earliestSubtitle = subtitle!;
            subtitle = this.subtitleList.at(earliestSubtitle.id - 1);
        }
        return earliestSubtitle.id;
    }

    
    /**
     * find the oldest overlapping subtitle from a previous overlapping subtitle index
     * @param startIndex - previous overlapping subtitle index
     * @param time - overlap time in milliseconds
     * @returns the oldest overlapping subtitle ID
     */
    private oldestOverlappingSubtitle(startIndex: number, time: number): number {
        for (let i = startIndex; i < this.subtitleList.length; i++) {
            const currentSubtitle = this.subtitleList[i];
            if (this.isOverlapping(currentSubtitle, time)) {
                continue;
            } else {
                return i - 1;
            }
        }
        throw new Error("No non-overlapping subtitle found");
    }

    private isOverlapping(subtitle: GlobalSubtitle, time: number): boolean {
        return subtitle.startTime <= time && time <= subtitle.endTime;
    }
}