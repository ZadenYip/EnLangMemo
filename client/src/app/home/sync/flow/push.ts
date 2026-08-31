import Logger from "electron-log/renderer.js";
import type { SyncError } from "@main/sync/error/error-types.js";
import { closeDialog, SyncProgressDialogComponent } from "../sync-progress-dialog.js";
import type { FlowDeps } from "./deps.js";
import { notifySyncError } from "./notify.js";
import type { MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom, tap } from "rxjs";
import { notifySyncComplete, notifySyncUnexpectedError } from "./notify.js";

export type SyncProgressDialogRef = MatDialogRef<SyncProgressDialogComponent>;

export function openSyncProgressDialog(deps: FlowDeps): SyncProgressDialogRef {
    return deps.dialog.open(SyncProgressDialogComponent, {
        disableClose: true,
        closeOnNavigation: false,
        hasBackdrop: true,
        width: "30rem",
    });
}

export async function runPushFlow(
    deps: FlowDeps,
    existingDialogRef?: SyncProgressDialogRef,
): Promise<void> {
    Logger.info("starting push flow");
    const dialogRef = existingDialogRef ?? openSyncProgressDialog(deps);
    dialogRef.componentInstance.setPhase("SYNC.PROGRESS.PHASE_PUSH");

    try {
        await lastValueFrom(window.observables.sync.push$().pipe(tap({
            next: (event) => {
                if (event.changes > 0) {
                    dialogRef.componentInstance.recordPushBatch(event.changes);
                    return;
                }
            },
            error: (error) => {
                Logger.error("sync push error", error);
                notifySyncError(deps, error as SyncError);
            },
            // TODO 重复牌组名 Angular 会报错 key 重复
            // 新集合会重复创建笔记模板
        })));
    } catch (error) {
        Logger.error("runPushFlow error", error);
        closeDialog(dialogRef);
        return;
    }
    await finishPushFlow(deps, dialogRef);
}

async function finishPushFlow(
    deps: FlowDeps,
    dialogRef: SyncProgressDialogRef
): Promise<void> {
    Logger.info("finishing push flow");
    try {
        const result = await window.service.sync.finish();
        if (result.kind === "success") {
            notifySyncComplete(deps);
        } else {
            notifySyncError(deps, result);
        }
    } catch (error) {
        Logger.error("unexpected sync finish error", error);
        notifySyncUnexpectedError(deps);
    }

    closeDialog(dialogRef);
}
