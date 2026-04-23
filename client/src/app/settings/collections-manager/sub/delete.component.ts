import { Component, signal, inject, input, output } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ConfirmDeleteDialogComponent } from "../../../shared/components";
import Logger from "electron-log";

@Component({
    selector: "app-collection-delete",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDialogModule,
        MatSnackBarModule,
    ],
    templateUrl: "./delete.component.html",
    styleUrl: "../cols.manager.component.scss",
})
export class DeleteComponent {
    private dialog = inject(MatDialog);
    private translate = inject(TranslateService);
    private snackBar = inject(MatSnackBar);

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
            await window.service.collectionService.deleteCollection(name);
            this.selectedDelColName.set("");
            this.collectionDeleted.emit();
        } catch (error) {
            Logger.error("Failed to delete collection:", error);
            const deleteFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.DELETE_FAILED"
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${deleteFailedMsg} - ${errorReason}`
                : deleteFailedMsg;
            this.snackBar.open(fullMsg, undefined, {
                duration: 3000,
                horizontalPosition: "center",
                verticalPosition: "top",
                panelClass: ["error-snackbar"],
            });
        }
    }
}
