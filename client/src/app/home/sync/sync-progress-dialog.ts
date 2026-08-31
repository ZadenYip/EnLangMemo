import { Component, signal } from "@angular/core";
import { MatDialogContent, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { TranslateModule } from "@ngx-translate/core";
import { SyncProgressDialogRef } from "./flow/push";

@Component({
    selector: "app-sync-progress-dialog",
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatProgressBarModule,
        TranslateModule,
    ],
    templateUrl: "./sync-progress-dialog.html",
    styleUrl: "./sync-progress-dialog.scss",
})
export class SyncProgressDialogComponent {
    readonly phase = signal("SYNC.PROGRESS.PHASE_PUSH");

    readonly pulledBatches = signal(0);
    readonly pulledChanges = signal(0);
    readonly appliedBatches = signal(0);
    readonly appliedChanges = signal(0);

    /** Number of acknowledged push batches in this sync session. */
    readonly pushedBatches = signal(0);

    /** Number of local changes acknowledged by the server in this sync session. */
    readonly pushedChanges = signal(0);

    setPhase(phase: string): void {
        this.phase.set(phase);
    }

    recordPullBatch(changes: number): void {
        this.pulledBatches.update((value) => value + 1);
        this.pulledChanges.update((value) => value + changes);
    }

    recordAppliedBatch(changes: number): void {
        this.appliedBatches.update((value) => value + 1);
        this.appliedChanges.update((value) => value + changes);
    }

    recordPushBatch(changes: number): void {
        this.pushedBatches.update((value) => value + 1);
        this.pushedChanges.update((value) => value + changes);
    }
}

export function closeDialog(dialogRef: SyncProgressDialogRef): void {
    setTimeout(() => dialogRef.close(), 1000);
}