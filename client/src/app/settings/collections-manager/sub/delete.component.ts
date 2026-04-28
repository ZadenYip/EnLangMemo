import { Component, signal, inject, input, output } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ConfirmDeleteDialogComponent } from "../../../shared/components";
import Logger from "electron-log";
import { NotifyService } from "../../../shared/services/notify.service";

@Component({
    selector: "app-collection-delete",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDialogModule,
    ],
    templateUrl: "./delete.component.html",
    styleUrl: "../../mat-card.scss",
})
export class DeleteComponent {
    private dialog = inject(MatDialog);
    private translate = inject(TranslateService);
    private notify = inject(NotifyService);

    deletableCols = input<string[]>([]);
    collectionDeleted = output<void>();

    selectedDelColName = signal("");

    async delCollection(): Promise<void> {
        const name = this.selectedDelColName();
        if (!name) return;

        const title = this.translate.instant("PAGES.SETTINGS.COLLECTIONS_MANAGER.DELETE.CONFIRM_DELETE.TITLE");
        const message = this.translate.instant("PAGES.SETTINGS.COLLECTIONS_MANAGER.DELETE.CONFIRM_DELETE.MESSAGE", { name });
        const confirmText = this.translate.instant("PAGES.SETTINGS.COLLECTIONS_MANAGER.DELETE.CONFIRM_DELETE.CONFIRM");

        // Open confirmation dialog
        const confirmed = await firstValueFrom(
            this.dialog.open(ConfirmDeleteDialogComponent, {
                data: {
                    title,
                    message,
                    confirmText,
                },
            }).afterClosed()
        );

        // If user did not confirm, exit
        if (!confirmed) {
            return;
        }

        try {
            await window.service.collection.deleteCollection(name);
            this.selectedDelColName.set("");
            this.collectionDeleted.emit();
            const successMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.DELETE.DELETED_SUCCESS",
                { name },
            );
            this.notify.open(successMsg);
        } catch (error) {
            Logger.error("Failed to delete collection:", error);
            const deleteFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.DELETE_FAILED"
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${deleteFailedMsg} - ${errorReason}`
                : deleteFailedMsg;
            this.notify.open(fullMsg);
        }
    }
}
