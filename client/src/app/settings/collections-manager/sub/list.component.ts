import { Component, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: "app-collection-list",
    imports: [
        TranslateModule,
        MatCardModule,
        MatListModule,
    ],
    templateUrl: "./list.component.html",
    styleUrl: "../cols.manager.component.scss",
})
export class ListComponent {
    collections = input<string[]>([]);
}
