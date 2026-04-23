import { Component, OnInit, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { CreateComponent } from "./sub/create.component";
import { DeleteComponent } from "./sub/delete.component";
import { ListComponent } from "./sub/list.component";
import { SwitchComponent } from "./sub/switch.component";

@Component({
    selector: "app-settings-collection",
    imports: [
        TranslateModule,
        CreateComponent,
        DeleteComponent,
        ListComponent,
        SwitchComponent,
    ],
    templateUrl: "./collection.component.html",
    styleUrl: "./collection.component.scss",
})
export class SettingsCollectionComponent implements OnInit {
    curAppColName = signal<string>("");
    listCollections = signal<string[]>([]);
    deletableCols = signal<string[]>([]);
    switchableCols = signal<string[]>([]);

    async ngOnInit(): Promise<void> {
        // Get current collection first, then load all collections
        this.curAppColName.set(
            await window.service.collectionService.getCurrentCollection()
        );
        await this.loadCollections();
    }

    private async loadCollections(): Promise<void> {
        const collections = await window.service.collectionService.listCollections();
        this.listCollections.set(collections);

        // Filter out the currently active collection
        const deletable = collections.filter(
            (name) => name !== this.curAppColName()
        );
        this.deletableCols.set(deletable);
        this.switchableCols.set(deletable);
    }

    async onCollectionCreated(): Promise<void> {
        await this.loadCollections();
    }

    async onCollectionDeleted(): Promise<void> {
        await this.loadCollections();
    }

    async onCollectionSwitched(name: string): Promise<void> {
        this.curAppColName.set(name);
        await this.loadCollections();
    }
}
