import { Component, signal, inject, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import Logger from "electron-log";

@Component({
    selector: "app-collection-switch",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatSnackBarModule,
    ],
    templateUrl: "./switch.component.html",
    styleUrl: "../collection.component.scss",
})
export class SwitchComponent {
    private translate = inject(TranslateService);
    private snackBar = inject(MatSnackBar);

    switchableCols = input<string[]>([]);
    currentCollectionName = input("");
    /**
     * Emits the name of the collection to switch to.
     */
    collectionSwitched = output<string>();

    selectedSwitchColName = signal("");

    async switchCollection(): Promise<void> {
        const name = this.selectedSwitchColName();
        if (!name) return;

        try {
            await window.service.collectionService.switchCollection(name);
        } catch (error) {
            Logger.error("Failed to switch collection:", error);
            const switchFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTION.ERRORS.SWITCH_FAILED",
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${switchFailedMsg} - ${errorReason}`
                : switchFailedMsg;
            this.snackBar.open(fullMsg, undefined, {
                duration: 3000,
                horizontalPosition: "center",
                verticalPosition: "top",
                panelClass: ["error-snackbar"],
            });
            return;
        }

        this.selectedSwitchColName.set("");
        this.collectionSwitched.emit(name);
        
        // Show success message to user
        const successMsg = this.translate.instant(
            "PAGES.SETTINGS.COLLECTION.SWITCH.SUCCESS",
            { name },
        );
        this.snackBar.open(successMsg, undefined, {
            duration: 2000,
            horizontalPosition: "center",
            verticalPosition: "top",
        });
    }
}
