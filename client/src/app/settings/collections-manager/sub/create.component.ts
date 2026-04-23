import { Component, inject, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import Logger from "electron-log";

@Component({
    selector: "app-collection-create",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
    ],
    templateUrl: "./create.component.html",
    styleUrl: "../cols.manager.component.scss",
})
export class CreateComponent {
    private translate = inject(TranslateService);
    private snackBar = inject(MatSnackBar);

    existingCollections = input<string[]>([]);
    collectionCreated = output<void>();

    createColName = "";

    onCollectionNameInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        // only accept name which allow in Win, Mac and Linux file system, and limit 20 chars
        const validName = input.value
            .replace(/[/\\?%*:|"<>]/g, "")
            .slice(0, 20);
        if (input.value !== validName) {
            input.value = validName;
            // show warning message to user
            const warningMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.INVALID_COLLECTION_NAME"
            );
            this.snackBar.open(warningMsg, undefined, {
                duration: 1000,
                horizontalPosition: "center",
                verticalPosition: "top",
            });
        }
        this.createColName = validName;
    }

    async createCollection(): Promise<void> {
        // Validate: name cannot be empty
        if (!this.createColName.trim()) {
            const errorMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.EMPTY_NAME"
            );
            this.snackBar.open(errorMsg, undefined, {
                duration: 2000,
                horizontalPosition: "center",
                verticalPosition: "top",
                panelClass: ["error-snackbar"],
            });
            return;
        }

        // Validate: name cannot be duplicated with existing collections
        if (this.existingCollections().includes(this.createColName)) {
            const errorMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.DUPLICATE_NAME"
            );
            this.snackBar.open(errorMsg, undefined, {
                duration: 2000,
                horizontalPosition: "center",
                verticalPosition: "top",
                panelClass: ["error-snackbar"],
            });
            return;
        }

        try {
            await window.service.collectionService.createCollection(this.createColName);
            this.createColName = "";
            this.collectionCreated.emit();
        } catch (error) {
            Logger.error("Failed to create collection:", error);
            const createFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.CREATE_FAILED"
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${createFailedMsg} - ${errorReason}`
                : createFailedMsg;
            this.snackBar.open(fullMsg, undefined, {
                duration: 2000,
                horizontalPosition: "center",
                verticalPosition: "top",
                panelClass: ["error-snackbar"],
            });
        }
    }
}
