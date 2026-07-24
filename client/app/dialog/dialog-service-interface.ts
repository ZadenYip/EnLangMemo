import { ProxyPropertyType } from "electron-ipc-cat/common";

export interface IDialogService {
    showOpenDialog(propose: string, extensions: string[]): Promise<string | null>;
}

export const DialogServiceIPCDescriptor = {
    channel: "dialogService",
    properties: {
        showOpenDialog: ProxyPropertyType.Function,
    },
};
