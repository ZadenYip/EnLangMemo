import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HomeService } from './service/home.service';
import { Observable, of } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { DataSource } from '@angular/cdk/table';
import { DeckListItem } from './deck-list-item.model';
import Logger from 'electron-log';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [TranslateModule, MatTableModule]
})
export class HomeComponent implements OnInit {
    private readonly router: Router = inject(Router);
    private homeService: HomeService = inject(HomeService);
    deckListSrc: DeckListDataSource = new DeckListDataSource(of([]));
    displayedColumns: string[] = ['id', 'name', 'newCardsPerDay', 'newCardsLearned'];
    // TODO 调整css样式
    deckList$: Observable<DeckListItem[]> | null = null;   

    ngOnInit(): void {
        Logger.info('HomeComponent initialized');
        this.reloadDecks();
    }

    reloadDecks() {
        Logger.info('Reloading decks...');
        this.deckListSrc = new DeckListDataSource(this.homeService.queryDeckList());
    }

    clickDeckRow(deck: DeckListItem) {
        Logger.info('Clicked deck row:', deck);
    }
}

export class DeckListDataSource extends DataSource<DeckListItem> {

    constructor(private deckList$: Observable<DeckListItem[]>) {
        super();
    }

    connect(): Observable<readonly DeckListItem[]> {
        return this.deckList$;
    }

    disconnect(): void {
        // No-op
    }
}
