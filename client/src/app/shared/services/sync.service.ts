import { Injectable, inject, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import Logger from "electron-log/renderer";
import { firstValueFrom } from "rxjs";
import {
    ConfirmDeleteDialog,
    type ConfirmDeleteDialogData,
} from "../components/dialog/confirm-delete/dialog.component";
import { NotifyService } from "./notify.service";
import { HandshakeStatus } from "@enlangmemo/sync-api/gen/enlangmemo/sync/v1/handshake_pb";


@Injectable({ providedIn: "root" })
export class SyncService {
    /** Material dialog service used for user confirmation flows. */
    private readonly dialog = inject(MatDialog);

    /** Notification service used for sync status messages. */
    private readonly notifyService = inject(NotifyService);

    /** Translation service used to localize sync messages. */
    private readonly translateService = inject(TranslateService);

    /** Whether a sync handshake or follow-up placeholder is currently running. */
    readonly syncBusy = signal(false);

    /** Start sync from the toolbar and handle the handshake result. */
    async startSync(): Promise<void> {
        if (this.syncBusy()) {
            return;
        }

        this.syncBusy.set(true);
        this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.SYNCING"));

        try {
            const result = await window.service.sync.handshake();
            if (result.kind === "rpc_error") {
                this.handleRpcError(result.code);
                return;
            }

            await this.handleHandshakeStatus(result.status, result.hasLocalChanges);
        } catch (error) {
            Logger.error("Unexpected sync IPC error", error);
            this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"));
        } finally {
            this.syncBusy.set(false);
        }
    }

    /** Handle a successful handshake status returned by the main process. */
    private async handleHandshakeStatus(status: number, hasLocalChanges: boolean): Promise<void> {
        switch (status) {
            case HandshakeStatus.NO_REMOTE_CHANGES:
                if (!hasLocalChanges) {
                    this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.NO_NEW_DATA"));
                    return;
                }
                this.continueSyncPlaceholder();
                return;
            case HandshakeStatus.NEED_PULL:
                this.continueSyncPlaceholder();
                return;
            case HandshakeStatus.UPLOAD_ALL:
                Logger.info("Upload-all sync path is not implemented yet.");
                return;
            case HandshakeStatus.LOCKED_BY_OTHER_CLIENT:
                this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.LOCKED_BY_OTHER_CLIENT"));
                return;
            case HandshakeStatus.CLIENT_TOO_OLD:
                this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.CLIENT_TOO_OLD"));
                return;
            case HandshakeStatus.SERVER_TOO_OLD:
                this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.SERVER_TOO_OLD"));
                return;
            case HandshakeStatus.TIME_SKEW_TOO_LARGE:
                this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.TIME_SKEW_TOO_LARGE"));
                return;
            case HandshakeStatus.CLIENT_DATA_TOO_OLD:
                this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.CLIENT_DATA_TOO_OLD"));
                return;
            case HandshakeStatus.COLLECTION_ID_MISMATCH:
                await this.confirmAndCorrectCollectionId();
                return;
            default:
                Logger.error("Unknown handshake status", status);
                this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"));
        }
    }

    /** Placeholder for the next Pull/Push sync phase after handshake. */
    private continueSyncPlaceholder(): void {
        this.notifyService.open(this.translateService.instant("SYNC.MESSAGES.SYNCING"));
        Logger.info("Next sync phase placeholder triggered.");
    }

    /** Ask the user before correcting the local collection identity. */
    private async confirmAndCorrectCollectionId(): Promise<void> {
        const confirmed = await firstValueFrom(
            this.dialog.open<ConfirmDeleteDialog, ConfirmDeleteDialogData, boolean>(ConfirmDeleteDialog, {
                data: {
                    title: this.translateService.instant("SYNC.COLLECTION_ID_MISMATCH.TITLE"),
                    message: this.translateService.instant("SYNC.COLLECTION_ID_MISMATCH.MESSAGE"),
                    confirmText: this.translateService.instant("SYNC.COLLECTION_ID_MISMATCH.CONFIRM"),
                    cancelText: this.translateService.instant("DIALOG.CANCEL"),
                },
            }).afterClosed(),
        );

        if (!confirmed) {
            return;
        }

        const corrected = await window.service.sync.correctColId();
        this.notifyService.open(
            this.translateService.instant(corrected
                ? "SYNC.MESSAGES.COLLECTION_ID_CORRECTED"
                : "SYNC.MESSAGES.COLLECTION_ID_CORRECT_FAILED"),
        );
    }

    /** Map sync RPC errors into user-facing notifications. */
    private handleRpcError(code: string): void {
        switch (code) {
            case "unauthenticated":
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.UNAUTHENTICATED"));
                return;
            case "deadline_exceeded":
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.DEADLINE_EXCEEDED"));
                return;
            case "unavailable":
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.UNAVAILABLE"));
                return;
            case "resource_exhausted":
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.RESOURCE_EXHAUSTED"));
                return;
            case "permission_denied":
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.PERMISSION_DENIED"));
                return;
            case "invalid_argument":
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.INVALID_ARGUMENT"));
                return;
            default:
                this.notifyService.open(this.translateService.instant("SYNC.ERRORS.UNKNOWN"));
        }
    }
}