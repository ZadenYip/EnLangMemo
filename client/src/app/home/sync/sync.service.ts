import { Injectable, inject, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import Logger from "electron-log/renderer";
import { NotifyService } from "../../shared/services/notify.service.js";
import type { FlowDeps } from "./flow/deps.js";
import { moveSyncPhase } from "./flow/handshake.js";

@Injectable({ providedIn: "root" })
export class SyncService {
    private readonly dialog = inject(MatDialog);

    private readonly notifyService = inject(NotifyService);

    private readonly translateService = inject(TranslateService);

    /** Whether a sync handshake or follow-up phase is currently running. */
    readonly syncBusy = signal(false);

    async startSync(): Promise<void> {
        if (this.syncBusy()) {
            return;
        }

        this.syncBusy.set(true);
        this.notifyService.open(
            this.translateService.instant("SYNC.MESSAGES.SYNCING"),
        );

        try {
            const result = await window.service.sync.handshake();
            await moveSyncPhase(result, this.buildFlowDeps());
        } catch (error) {
            Logger.error("unexpected sync IPC error", error);
            this.notifyService.open(
                this.translateService.instant("SYNC.MESSAGES.UNEXPECTED_ERROR"),
            );
        } finally {
            this.syncBusy.set(false);
        }
    }

    private buildFlowDeps(): FlowDeps {
        return {
            dialog: this.dialog,
            notify: this.notifyService,
            translate: this.translateService,
        };
    }
}
