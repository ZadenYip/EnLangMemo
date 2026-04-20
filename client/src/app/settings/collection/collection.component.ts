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

    collectionName = "";
    selectedDeleteCollectionId = "";
    createdCollections: UserProfileCollection[] = [];

    onCollectionNameInput(event: Event): void {
        const target = event.target as HTMLInputElement | null;
        this.collectionName = target?.value ?? "";
    }

    onDbAccountChange(accountId: string): void {
        //
    }

    createCollection(): void {
        //
    }

    deleteCollection(): void {
        //
    }
}
