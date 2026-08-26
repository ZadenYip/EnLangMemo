import { dialog } from "electron";
import { IDialogService } from "./dialog-service-interface.js";

export class DialogService implements IDialogService {
    public async showOpenDialog(propose: string, extensions: string[]): Promise<string | null> {
        const result = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ name: propose, extensions }]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0] ?? null;
    }
}
