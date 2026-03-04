import { Component, OnInit } from '@angular/core';
import Logger from 'electron-log/renderer';

@Component({
    selector: 'app-page-not-found',
    templateUrl: './page-not-found.component.html',
    styleUrls: ['./page-not-found.component.scss'],
    standalone: true,
})
export class PageNotFoundComponent implements OnInit {

    ngOnInit(): void {
        Logger.info('PageNotFoundComponent INIT');
    }
}
