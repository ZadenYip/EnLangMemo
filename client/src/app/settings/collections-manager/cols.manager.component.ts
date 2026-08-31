import { Component, inject, OnInit, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { CreateComponent } from "./sub/create.component";
import { DeleteComponent } from "./sub/delete.component";
import { ListComponent } from "./sub/list.component";
import { SwitchComponent } from "./sub/switch.component";
import { AuthService } from "@render/shared/services/auth.service";
import { DeckService } from "@render/home/deck/service";

@Component({
    selector: "app-collections-manager",
    imports: [
        TranslateModule,
        CreateComponent,
        DeleteComponent,
        ListComponent,
        SwitchComponent,
    ],
    templateUrl: "./cols.manager.component.html",
    styleUrl: "./cols.manager.component.scss",
})
export class CollectionsManagerComponent implements OnInit {
    private auth = inject(AuthService);
    private readonly deckService = inject(DeckService);
    
    curAppColName = signal<string>("");
    listCollections = signal<string[]>([]);
    deletableCols = signal<string[]>([]);
    switchableCols = signal<string[]>([]);

    async ngOnInit(): Promise<void> {
        // Get current collection first, then load all collections
        this.curAppColName.set(
            await window.service.collection.getCurCol()
        );
        await this.loadCollections();
    }

    private async loadCollections(): Promise<void> {
        const collections = await window.service.collection.listCollections();
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
        await this.auth.refreshCurrentUser();
        await this.loadCollections();
    }
}
