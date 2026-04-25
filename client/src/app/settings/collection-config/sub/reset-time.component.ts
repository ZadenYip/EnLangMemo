import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import Logger from "electron-log/renderer";

@Component({
    selector: "app-collection-daily-reset-time",
    imports: [
        TranslatePipe,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule,
        FormsModule,
    ],
    templateUrl: "./reset-time.component.html",
    styleUrl: "../../mat-card.scss",
})
export class DailyResetTimeComponent {
    private snackBar = inject(MatSnackBar);
    private translate = inject(TranslateService);

    dailyResetTime = 4;

    /**
     * keep the input value between 0 and 23.
     * Non-integer input will be prevented by the input tag's attributes
     */
    onDailyResetTimeInput(event: Event): void {
        const inputEl = event.target as HTMLInputElement;
        const raw = Number(inputEl.value);

        if (Number.isNaN(raw)) {
            return;
        }

        const hour = Math.max(0, Math.min(23, Math.trunc(raw)));
        inputEl.value = hour.toString();
        this.dailyResetTime = hour;
    }

    /**
     * Call collection service to change the daily review reset time
     * This function may be expanded in the future to support more collection config changes
     */
    async onSaveConfig(): Promise<void> {
        try {
            await window.service.collection.changeColReviewRstTime(this.dailyResetTime);
        } catch (error) {
            Logger.error("Failed to change collection daily reset time:", error);
            const saveFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTION_CONFIG.ERRORS.SAVE_FAILED",
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${saveFailedMsg} - ${errorReason}`
                : `${saveFailedMsg}`;

            this.snackBar.open(fullMsg, undefined, {
                duration: 3000,
                horizontalPosition: "center",
                verticalPosition: "top",
                panelClass: ["error-snackbar"],
            });
            return;
        }

        const successMsg = this.translate.instant(
            "PAGES.SETTINGS.COLLECTION_CONFIG.SUCCESS.SAVE",
        );
        this.snackBar.open(`${successMsg}`, undefined, {
            duration: 2000,
            horizontalPosition: "center",
            verticalPosition: "top",
        });
    }
}

