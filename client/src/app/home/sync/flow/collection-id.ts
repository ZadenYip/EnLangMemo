import { firstValueFrom } from "rxjs";
import {
    ConfirmDeleteDialog,
    type ConfirmDeleteDialogData,
} from "../../../shared/components/dialog/confirm-delete/dialog.component.js";
import type { FlowDeps } from "./deps.js";
import Logger from "electron-log";

export async function confirmAndCorrectCollectionId(deps: FlowDeps): Promise<void> {
    const confirmed = await firstValueFrom(
        deps.dialog
            .open<ConfirmDeleteDialog, ConfirmDeleteDialogData, boolean>(
                ConfirmDeleteDialog,
                {
                    data: {
                        title: deps.translate.instant("SYNC.COLLECTION_ID_MISMATCH.TITLE"),
                        message: deps.translate.instant("SYNC.COLLECTION_ID_MISMATCH.MESSAGE"),
                        confirmText: deps.translate.instant("SYNC.COLLECTION_ID_MISMATCH.CONFIRM"),
                        cancelText: deps.translate.instant("DIALOG.CANCEL"),
                    },
                },
            )
            .afterClosed(),
    );

    if (!confirmed) {
        Logger.info("user canceled collection ID correction.");
        await window.service.sync.clearSession();
        return;
    }

    let corrected = false;
    try {
        Logger.info("attempting to correct collection ID...");
        corrected = await window.service.sync.correctColId();
    } catch (error) {
        Logger.error("unexpected sync correctColId error", error);
        deps.notify.open(
            deps.translate.instant("SYNC.MESSAGES.COLLECTION_ID_CORRECT_FAILED"),
        );
        return;
    }
    deps.notify.open(
        deps.translate.instant(
            corrected
                ? "SYNC.MESSAGES.COLLECTION_ID_CORRECTED"
                : "SYNC.MESSAGES.COLLECTION_ID_CORRECT_FAILED",
        ),
    );
}
