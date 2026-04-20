import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { TranslateModule } from "@ngx-translate/core";

interface DbAccountProfile {
    id: string;
    name: string;
}

interface UserProfileCollection {
    id: string;
    name: string;
    accountName: string;
    createdAt: string;
}

@Component({
    selector: "app-settings-collection",
    imports: [
        TranslateModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatListModule,
    ],
    templateUrl: "./collection.component.html",
    styleUrl: "./collection.component.scss",
})
export class SettingsCollectionComponent {
    readonly dbAccountProfiles: DbAccountProfile[] = [
        { id: "account-default", name: "Default Account" },
        { id: "account-work", name: "Work Account" },
        { id: "account-personal", name: "Personal Account" },
    ];

    collectionName = "";
    selectedDbAccountId = this.dbAccountProfiles[0].id;
    createdCollections: UserProfileCollection[] = [];
    errorKey: string | null = null;

    onCollectionNameInput(event: Event): void {
        const target = event.target as HTMLInputElement | null;
        this.collectionName = target?.value ?? "";
        this.errorKey = null;
    }

    onDbAccountChange(accountId: string): void {
        this.selectedDbAccountId = accountId;
        this.errorKey = null;
    }

    createCollection(): void {
        const trimmedName = this.collectionName.trim();
        if (!trimmedName) {
            this.errorKey = "PAGES.SETTING.COLLECTION.ERRORS.EMPTY_NAME";
            return;
        }

        const isDuplicate = this.createdCollections.some(
            collection => collection.name.toLowerCase() === trimmedName.toLowerCase(),
        );
        if (isDuplicate) {
            this.errorKey = "PAGES.SETTING.COLLECTION.ERRORS.DUPLICATE_NAME";
            return;
        }

        const selectedAccount = this.dbAccountProfiles.find(
            account => account.id === this.selectedDbAccountId,
        );
        if (!selectedAccount) {
            this.errorKey = "PAGES.SETTING.COLLECTION.ERRORS.NO_ACCOUNT";
            return;
        }

        this.createdCollections = [
            {
                id: crypto.randomUUID(),
                name: trimmedName,
                accountName: selectedAccount.name,
                createdAt: new Date().toLocaleString(),
            },
            ...this.createdCollections,
        ];

        this.collectionName = "";
        this.errorKey = null;
    }
}
