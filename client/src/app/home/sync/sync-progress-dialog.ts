import { Component, signal } from "@angular/core";
import { MatDialogContent, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { TranslateModule } from "@ngx-translate/core";

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
    /** Number of acknowledged push batches in this sync session. */
    readonly pushedBatches = signal(0);

    /** Number of local changes acknowledged by the server in this sync session. */
    readonly pushedChanges = signal(0);

    recordPushBatch(changes: number): void {
        this.pushedBatches.update((value) => value + 1);
        this.pushedChanges.update((value) => value + changes);
    }
}
