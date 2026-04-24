import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: "app-collection-daily-reset-time",
    imports: [TranslateModule, MatCardModule, MatFormFieldModule, MatInputModule, FormsModule],
    templateUrl: "./reset-time.component.html",
    styleUrl: "../../mat-card.scss",
})
export class DailyResetTimeComponent {
    dailyResetTime = 4;

    /**
     * keep the input value between 0 and 23.
     * Non-integer input will be prevented by the input tag's attributes
     * @param _event
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
}
