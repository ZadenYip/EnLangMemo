import { Component, signal, inject, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import Logger from "electron-log";
import { NotifyService } from "../../../shared/services/notify.service";

@Component({
    selector: "app-collection-switch",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
    ],
    templateUrl: "./switch.component.html",
    styleUrl: "../../mat-card.scss",
})
export class SwitchComponent {
    private translate = inject(TranslateService);
    private notify = inject(NotifyService);

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
            await window.service.collection.switchCollection(name);
        } catch (error) {
            Logger.error("Failed to switch collection:", error);
            const switchFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.SWITCH_FAILED",
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${switchFailedMsg} - ${errorReason}`
                : switchFailedMsg;
            this.notify.open(fullMsg);
            return;
        }

        this.selectedSwitchColName.set("");
        this.collectionSwitched.emit(name);
        
        // Show success message to user
        const successMsg = this.translate.instant(
            "PAGES.SETTINGS.COLLECTIONS_MANAGER.SWITCH.SUCCESS",
            { name },
        );
        this.notify.open(successMsg);
    }
}
