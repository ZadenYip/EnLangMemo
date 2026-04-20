import { Component, HostListener, inject } from "@angular/core";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import {
    Router,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
} from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import Logger from "electron-log/renderer";
import { DictionaryComponent } from "./shared/dictionary/dictionary.component";
import { DictionaryWindowService } from "./shared/dictionary/dictionary-window.service";
import { APP_PATHS } from "./root-route";

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
        MatToolbarModule,
        TranslatePipe,
        DictionaryComponent,
    ],
})
export class AppComponent {
    private readonly router: Router = inject(Router);
    private readonly translate: TranslateService = inject(TranslateService);
    private readonly dictionaryWindowService = inject(DictionaryWindowService);

    readonly tabs = [
        { label: "HEADER.DECKS", path: `${APP_PATHS.home}` },
        { label: "HEADER.IMMERSE", path: `${APP_PATHS.immerse}` },
        { label: "HEADER.BROWSE", path: `${APP_PATHS.browse}` },
        { label: "HEADER.STATS", path: `${APP_PATHS.stats}` },
        { label: "HEADER.SETTINGS", path: `${APP_PATHS.settings}` },
    ] as const;

    /**
     *
     * @param path - The path to check for active state锛坋.g., "/home"锛?
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

    onSync() {
        Logger.info("Sync triggered");
    }

    @HostListener("document:mousedown", ["$event"])
    onDocumentMouseDown(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }

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
