import { Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import {
    Router,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

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
        console.log('Sync triggered');
    }

    constructor(private router: Router, private translate: TranslateService) {
        this.translate.setDefaultLang('en');
        // Use browser language
        this.translate.use(navigator.language);

        console.log('APP_CONFIG', APP_CONFIG);
    }
}
