import { GlobalSubtitle } from "../subtitle-interface";
import { IntervalTree } from "./interval-tree";

export class SubtitleManager {
    private lastActiveIDs = new Set<number>();
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

    get subtitles() : GlobalSubtitle[] {
        return this.subtitleList;
    }

    public refreshSubtitlesRef(): void {
        this.subtitleList = [...this.subtitleList];
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
        const activeSubtitleIDs = new Set<number>();

        const subtitleIDs = this.findSubtitleAtTime(time);
        // current subtitle is past, need to use interval tree search
        subtitleIDs.forEach((id) => activeSubtitleIDs.add(id));


        if (this.isSequenceEqual(activeSubtitleIDs, this.lastActiveIDs)) {
            return this.lastActiveIDs;
        } else {
            this.lastActiveIDs = activeSubtitleIDs;
            return activeSubtitleIDs;
        }
    }

    /**
     * only for continuous subtitle sequences, not for disjoint subtitles
     * @param setA 
     * @param setB 
     * @returns whether two sets are equal by comparing their sums, works for continuous subtitle sequences
     */
    private isSequenceEqual(setA: Set<number>, setB: Set<number>): boolean {
        if (setA.size !== setB.size) {
            return false;
        }

        let sumA = 0;
        for (const item of setA) {
            sumA += item;
        }

        let sumB = 0;
        for (const item of setB) {
            sumB += item;
        }

        return sumA === sumB;
    }

    /**
     * 
     * @param time - time in milliseconds
     * @returns array of active subtitle IDs
     */
    private findSubtitleAtTime(time: number): number[] {
        const subtitleIDs: number[] = [];
        const value = this.subtitleTree.search(time, time);

        if (!value) {
            return subtitleIDs;
        }

        const earliestSubtitleID = this.earliestOverlappingSubtitle(value.id, time);
        const lastestSubtitleID = this.lastestOverlappingSubtitle(value.id, time);

        for (let i = earliestSubtitleID; i <= lastestSubtitleID; i++) {
            subtitleIDs.push(i);
        }

        return subtitleIDs;
    }

    private earliestOverlappingSubtitle(startIndex: number, time: number): number {
        let searchIndex = startIndex;
        while (searchIndex - 1 >= 0) {
            const currentSubtitle = this.subtitleList[searchIndex - 1];
            if (this.isOverlapping(currentSubtitle, time)) {
                searchIndex -= 1;
            } else {
                break;
            }
        }
        return searchIndex;
    }

    
    /**
     * find the oldest overlapping subtitle from a previous overlapping subtitle index
     * @param startIndex - previous overlapping subtitle index
     * @param time - overlap time in milliseconds
     * @returns the oldest overlapping subtitle ID
     */
    private lastestOverlappingSubtitle(startIndex: number, time: number): number {
        let searchIndex = startIndex;
        while (searchIndex + 1 < this.subtitleList.length) {
            const currentSubtitle = this.subtitleList[searchIndex + 1];
            if (this.isOverlapping(currentSubtitle, time)) {
                searchIndex += 1;
            } else {
                break;
            }
        }
        
        return searchIndex;
    }

    private isOverlapping(subtitle: GlobalSubtitle, time: number): boolean {
        return subtitle.startTime <= time && time <= subtitle.endTime;
    }
}