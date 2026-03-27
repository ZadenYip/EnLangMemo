import { ProxyPropertyType } from "electron-ipc-cat/common";
import { DictionaryEntry } from "./dic-service-types";

export interface IDatabaseService {
    queryWord(spelling: string): Promise<DictionaryEntry | null>;
}

export const DicServiceIPCDescriptor = {
    channel: 'dicService',
    properties: {
        queryWord: ProxyPropertyType.Function,
    },
};
