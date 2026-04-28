import { Component, inject, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import Logger from "electron-log";
import { NotifyService } from "../../../shared/services/notify.service";

@Component({
    selector: "app-collection-create",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    templateUrl: "./create.component.html",
    styleUrl: "../../mat-card.scss",
})
export class CreateComponent {
    private translate = inject(TranslateService);
    private notify = inject(NotifyService);

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
            this.notify.open(warningMsg);
        }
        this.createColName = validName;
    }

    async createCollection(): Promise<void> {
        // Validate: name cannot be empty
        if (!this.createColName.trim()) {
            const errorMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.EMPTY_NAME"
            );
            this.notify.open(errorMsg);
            return;
        }

        // Validate: name cannot be duplicated with existing collections
        if (this.existingCollections().includes(this.createColName)) {
            const errorMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.DUPLICATE_NAME"
            );
            this.notify.open(errorMsg);
            return;
        }

        try {
            await window.service.collection.createCollection(this.createColName);
        } catch (error) {
            Logger.error("Failed to create collection:", error);
            const createFailedMsg = this.translate.instant(
                "PAGES.SETTINGS.COLLECTIONS_MANAGER.ERRORS.CREATE_FAILED"
            );
            const errorReason = error instanceof Error ? error.message : "";
            const fullMsg = errorReason
                ? `${createFailedMsg} - ${errorReason}`
                : createFailedMsg;
            this.notify.open(fullMsg);
            return;
        }

        const createdName = this.createColName;
        this.createColName = "";
        this.collectionCreated.emit();
        const successMsg = this.translate.instant(
            "PAGES.SETTINGS.COLLECTIONS_MANAGER.CREATED.CREATED_SUCCESS",
            { name: createdName },
        );
        this.notify.open(successMsg);
    }
}
