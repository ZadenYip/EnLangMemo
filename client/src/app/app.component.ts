import { Component, HostListener, OnInit, inject } from "@angular/core";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import {
    Router,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
} from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import Logger from "electron-log/renderer.js";
import { DictionaryComponent } from "./shared/dictionary/dictionary.component.js";
import { DictionaryWindowService } from "./shared/dictionary/dictionary-window.service.js";
import { AuthService } from "./shared/services/auth.service.js";
import { SyncService } from "./shared/services/sync.service.js";
import { APP_PATHS } from "./root-route.js";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatButtonModule,
        MatMenuModule,
        MatToolbarModule,
        TranslatePipe,
        DictionaryComponent,
    ],
})
export class AppComponent implements OnInit {
    private readonly router: Router = inject(Router);
    private readonly translate: TranslateService = inject(TranslateService);
    private readonly dictionaryWindowService = inject(DictionaryWindowService);
    /** Renderer auth status facade for the toolbar. */
    readonly auth = inject(AuthService);
    /** Renderer sync facade for the toolbar. */
    readonly sync = inject(SyncService);

    readonly tabs = [
        { label: "HEADER.DECKS", path: `${APP_PATHS.deck}` },
        { label: "HEADER.PROCESSING", path: `${APP_PATHS.processing}` },
        { label: "HEADER.IMMERSE", path: `${APP_PATHS.immerse}` },
        { label: "HEADER.BROWSE", path: `${APP_PATHS.browse}` },
        { label: "HEADER.STATS", path: `${APP_PATHS.stats}` },
        { label: "HEADER.SETTINGS", path: `${APP_PATHS.settings}` },
    ] as const;

    ngOnInit(): void {
        void this.auth.refreshCurrentUser();
    }

    /**
     *
     * @param path - The path to check for activeness. e.g. "/deck" or "/settings/profile".
     * @returns True if the path is active, false otherwise
     */
    isActive = (path: string): boolean => {
        return this.router.isActive(path, {
            paths: "subset",
            queryParams: "subset",
            fragment: "ignored",
            matrixParams: "ignored",
        });
    };

    async onSync(): Promise<void> {
        Logger.info("sync triggered");
        await this.sync.startSync();
    }

    /** Handle toolbar auth button click. */
    async onAuthStatusClick(): Promise<void> {
        await this.auth.login();
    }

    /** Handle toolbar logout menu action. */
    async onLogoutClick(): Promise<void> {
        await this.auth.logout();
    }

    /**
     * dictionary window should be hidden when clicking outside of it
     * @param event - The mouse down event to handle.
     */
    @HostListener("document:mousedown", ["$event"])
    onDocumentMouseDown(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }

        // If the click is inside the dictionary window, do not hide it
        if (target.closest("app-dictionary")) {
            return;
        }

        this.dictionaryWindowService.hide();
    }

    constructor() {
        this.translate.setDefaultLang("en");
        // Use browser language
        this.translate.use(navigator.language);
        Logger.info("language set to", navigator.language);
    }
}
