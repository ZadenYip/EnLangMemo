import { Component } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
    Router,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import Logger from 'electron-log/renderer';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatButtonModule,
        MatToolbarModule,
        TranslatePipe,
    ],
})
export class AppComponent {
    readonly tabs = [
        { label: 'HEADER.DECKS', path: '/home' },
        { label: 'HEADER.IMMERSE', path: '/immerse' },
        { label: 'HEADER.BROWSE', path: '/browse' },
        { label: 'HEADER.STATS', path: '/stats' },
    ] as const;

    /**
     *
     * @param path - The path to check for active state（e.g., '/home'）
     * @returns True if the path is active, false otherwise
     */
    isActive = (path: string): boolean => {
        return this.router.isActive(path, {
            paths: 'subset',
            queryParams: 'subset',
            fragment: 'ignored',
            matrixParams: 'ignored',
        });
    };

    onSync() {
        Logger.info('Sync triggered');
    }

    constructor(private router: Router, private translate: TranslateService) {
        this.translate.setDefaultLang('en');
        // Use browser language
        this.translate.use(navigator.language);
        Logger.info('language set to', navigator.language);
    }
}
