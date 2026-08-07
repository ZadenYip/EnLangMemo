import { ProxyPropertyType } from "electron-ipc-cat/common";
import { Observable } from "rxjs";
import { DictionaryEntry } from "./dic-service-types";
import { DicImpProgress } from "../../import/dictionary/dic-import-types";

export interface IDatabaseService {
    queryWord(spelling: string): Promise<DictionaryEntry | null>;
    importDictionary$(path: string): Observable<DicImpProgress>;
}

export const DicServiceIPCDescriptor = {
    channel: "dicService",
    properties: {
        queryWord: ProxyPropertyType.Function,
        importDictionary$: ProxyPropertyType.Function$,
    },
};
