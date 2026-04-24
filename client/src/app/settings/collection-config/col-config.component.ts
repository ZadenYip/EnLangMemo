import { Component } from "@angular/core";
import { DailyResetTimeComponent } from "./sub/reset-time.component";

@Component({
    selector: "app-collection-config",
    imports: [DailyResetTimeComponent],
    templateUrl: "./col-config.component.html",
    styleUrl: "./col-config.component.scss",
})
export class CollectionConfigComponent {
    
}
