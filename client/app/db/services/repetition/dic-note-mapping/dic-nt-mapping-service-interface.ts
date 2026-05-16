import { ProxyPropertyType } from "electron-ipc-cat/common";
import { DicNoteMapWithNoteType } from "./dic-nt-mapping.types";

export interface IDicNoteMappingService {
    /**
     * Get current dictionary note mapping config.
     */
    getMappingConfig(): Promise<DicNoteMapWithNoteType | null>;

    /**
     * Save current dictionary note mapping config.
     */
    saveMappingConfig(config: DicNoteMapWithNoteType): Promise<void>;
}

export const DicNoteMappingServiceIPCDescriptor = {
    channel: "dicNoteMappingService",
    properties: {
        getMappingConfig: ProxyPropertyType.Function,
        saveMappingConfig: ProxyPropertyType.Function,
    },
};
