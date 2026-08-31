import Logger from "electron-log/renderer.js";
import type { SyncError } from "@main/sync/error/error-types.js";
import type { FlowDeps } from "./deps.js";
import { notifySyncError } from "./notify.js";
import {
    openSyncProgressDialog,
    runPushFlow,
    type SyncProgressDialogRef,
} from "./push.js";
import { closeDialog } from "../sync-progress-dialog.js";
import { lastValueFrom, tap } from "rxjs";
import { notifySyncComplete, notifySyncUnexpectedError } from "./notify.js";

export async function runPullFlow(deps: FlowDeps): Promise<void> {
    Logger.info("starting pull flow");
    const dialogRef = openSyncProgressDialog(deps);
    dialogRef.componentInstance.setPhase("SYNC.PROGRESS.PHASE_PULL_DOWNLOAD");

    try {
        await lastValueFrom(window.observables.sync.pull$().pipe(tap({
            next: (event) => {
                dialogRef.componentInstance.recordPullBatch(event.changes);
            },
            error: (error) => {
                Logger.error("sync pull error", error);
                notifySyncError(deps, error as SyncError);
            }
        })));
    } catch (error) {
        Logger.error("runPullFlow error", error);
        closeDialog(dialogRef);
        return;
    }
    try {
        await runApplyPullFlow(deps, dialogRef);
    } catch (error) {
        Logger.error("runApplyPullFlow error", error);
        notifySyncError(deps, error as SyncError);
        closeDialog(dialogRef);
        return;
    }

    let hasLocalChanges: boolean;
    try {
        hasLocalChanges = await window.service.sync.hasLocalChanges();
    } catch (error) {
        Logger.error("check local changes error in runPullFlow", error);
        notifySyncUnexpectedError(deps);
        closeDialog(dialogRef);
        return;
    }
    
    if (hasLocalChanges) {
        await runPushFlow(deps, dialogRef);
    } else {
        await finishAfterPullFlow(deps, dialogRef);
    }
}


async function runApplyPullFlow(
    deps: FlowDeps,
    dialogRef: SyncProgressDialogRef,
): Promise<void> {
    Logger.info("starting apply-pull flow");
    dialogRef.componentInstance.setPhase("SYNC.PROGRESS.PHASE_PULL_APPLY");
    await lastValueFrom(window.observables.sync.applyPull$().pipe(tap({
        next: (event) => {
            dialogRef.componentInstance.recordAppliedBatch(event.changes);
        },
        error: (error) => {
            Logger.error("sync apply-pull error", error);
            notifySyncError(deps, error as SyncError);
        },
    })));
}

async function finishAfterPullFlow(
    deps: FlowDeps,
    dialogRef: SyncProgressDialogRef,
): Promise<void> {
    Logger.info("finishing after pull flow");
    try {
        const result = await window.service.sync.finishAfterPull();
        if (result.kind !== "success") {
            notifySyncError(deps, result);
        } else {
            Logger.info("sync finish successful after pull flow");
            notifySyncComplete(deps);
        }
    } catch (error) {
        Logger.error("unexpected ipc error in finishAfterPullFlow", error);
        notifySyncUnexpectedError(deps);
    }
    closeDialog(dialogRef);
}