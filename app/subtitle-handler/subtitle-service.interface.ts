import { ProxyPropertyType } from "electron-ipc-cat/common";
import { Observable } from "rxjs";

export interface ISubtitleService {
    fetchSubtitles$(filePath: string): Observable<Cue>;
}

export interface Cue {
    sequence: number;
    startTime: number;
    endTime: number;
    textLines: string[];
}

export const SubtitleServiceIPCDescriptor = {
    channel: 'subtitleService',
    properties: {
        fetchSubtitles$: ProxyPropertyType.Function$
    },
};
