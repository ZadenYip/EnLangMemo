import { ProxyPropertyType } from "electron-ipc-cat/common";
import { DictionaryEntry } from "./dic-service-types";
import { ImportResult } from "../import/dictionary/dic-import-type";

export interface IDatabaseService {
    queryWord(spelling: string): Promise<DictionaryEntry | null>;
    importWords(path: string): Promise<ImportResult>;
    importWordPoses(path: string): Promise<ImportResult>;
    importDefinitions(path: string): Promise<ImportResult>;
    importExamples(path: string): Promise<ImportResult>;
}

export const DicServiceIPCDescriptor = {
    channel: "dicService",
    properties: {
        queryWord: ProxyPropertyType.Function,
        importWords: ProxyPropertyType.Function,
        importWordPoses: ProxyPropertyType.Function,
        importDefinitions: ProxyPropertyType.Function,
        importExamples: ProxyPropertyType.Function
    },
};
