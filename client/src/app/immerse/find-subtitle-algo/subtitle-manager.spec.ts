import { SubtitleManager } from "./subtitle-manager";


describe('SubtitleManager', () => {

    it('should add subtitles and find active subtitle IDs at a given time', () => {
        const manager = new SubtitleManager();
        
        // id does not matter when adding, will be reassigned
        manager.add({ id: 0, startTime: 0, endTime: 1000, textLines: ['Hello'] });
        manager.add({ id: 1, startTime: 500, endTime: 1500, textLines: ['World'] });
        manager.add({ id: 2, startTime: 2000, endTime: 3000, textLines: ['!'] });

        let activeIDs = manager.nextSubtitleIds(750);
        expect(activeIDs).toEqual(new Set([0, 1]));
        activeIDs = manager.nextSubtitleIds(2500);
        expect(activeIDs).toEqual(new Set([2]));
        activeIDs = manager.nextSubtitleIds(3500);
        expect(activeIDs).toEqual(new Set());
    });

    it('should return empty subtitle when initialized with empty tip', () => {
        const emptyTip = 'No subtitles available';
        const manager = new SubtitleManager(emptyTip);
        expect(manager.subtitles.length).toBe(1);
        expect(manager.subtitles[0].textLines).toEqual([emptyTip]);
    });

    it('should get a couple of subtitles correctly', () => {
        const manager = new SubtitleManager();
        manager.add({ id: 0, startTime: 0, endTime: 1000, textLines: ['First'] });
        manager.add({ id: 1, startTime: 400, endTime: 1000, textLines: ['Second'] });
        manager.add({ id: 2, startTime: 500, endTime: 1000, textLines: ['Third'] });

        let activeIDs = manager.nextSubtitleIds(300);
        expect(activeIDs).toEqual(new Set([0]));
        activeIDs = manager.nextSubtitleIds(450);
        expect(activeIDs).toEqual(new Set([0, 1]));
        activeIDs = manager.nextSubtitleIds(600);
        expect(activeIDs).toEqual(new Set([0, 1, 2]));
        activeIDs = manager.nextSubtitleIds(1300);
        expect(activeIDs).toEqual(new Set());
    });

    it('should have same subtitle references with same activeIDs', () => {
        const manager = new SubtitleManager();
        manager.add({ id: 0, startTime: 0, endTime: 1000, textLines: ['Alpha'] });
        manager.add({ id: 1, startTime: 500, endTime: 1000, textLines: ['Beta'] });
        manager.add({ id: 2, startTime: 1000, endTime: 1000, textLines: ['Gamma'] });

        let activeIDs = manager.nextSubtitleIds(400);
        let sameActiveIDs = manager.nextSubtitleIds(450);
        expect(activeIDs).toBe(sameActiveIDs);

        activeIDs = manager.nextSubtitleIds(600);
        sameActiveIDs = manager.nextSubtitleIds(700);
        expect(activeIDs).toBe(sameActiveIDs);

        activeIDs = manager.nextSubtitleIds(1100);
        sameActiveIDs = manager.nextSubtitleIds(1200);
        expect(activeIDs).toBe(sameActiveIDs);
        
    });
});