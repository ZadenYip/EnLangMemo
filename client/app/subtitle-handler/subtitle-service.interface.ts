import { ProxyPropertyType } from "electron-ipc-cat/common";
import { Observable } from "rxjs";
import { GlobalSubtitle } from "./types";

export interface ISubtitleService {
    fetchSubtitles$(filePath: string): Observable<GlobalSubtitle>;
}

export const SubtitleServiceIPCDescriptor = {
    channel: 'subtitleService',
    properties: {
        fetchSubtitles$: ProxyPropertyType.Function$
    },
};
