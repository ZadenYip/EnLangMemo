import Logger from "electron-log/renderer.js";
import { SyncProgressDialogComponent } from "../sync-progress-dialog.js";
import type { FlowDeps } from "./deps.js";
import { notifyRpcError } from "./error.js";

export async function runPushFlow(deps: FlowDeps): Promise<void> {
    const dialogRef = deps.dialog.open(SyncProgressDialogComponent, {
        disableClose: true,
        closeOnNavigation: false,
        hasBackdrop: true,
        width: "30rem",
    });

    const closeDialog = (): void => {
        setTimeout(() => {
            dialogRef.close();
        }, 1000);
    };

    window.observables.sync.push$().subscribe({
        next: (event) => {
            if (event.kind === "success" && event.changes > 0) {
                dialogRef.componentInstance.recordPushBatch(event.changes);
                return;
            } else if (event.kind === "rpc_error") {
                notifyRpcError(deps, event.code);
            }
        },
        error: (error) => {
            Logger.error("unexpected sync push error", error);
            deps.notify.open(
                deps.translate.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"),
            );
            closeDialog();
        },
        complete: async () => {
            try {
                const result = await window.service.sync.finish();
                if (result.kind === "success") {
                    deps.notify.open(
                        deps.translate.instant("SYNC.MESSAGES.SYNC_COMPLETED"),
                    );
                } else {
                    notifyRpcError(deps, result.code);
                }
            } catch (error) {
                Logger.error("unexpected sync finish error", error);
                deps.notify.open(
                    deps.translate.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"),
                );
            }

            closeDialog();
        },
    });
}
