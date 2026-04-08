import { Component } from "@angular/core";
import { SidenavComponent } from "@render/shared/sidenav/sidenav-layout";
import { BROWSE_ROUTES } from "./route";

@Component({
    selector: "app-browse",
    imports: [SidenavComponent],
    templateUrl: "./browse.component.html",
    styleUrl: "./browse.component.scss",
})
export class BrowseComponent {
    readonly routes = BROWSE_ROUTES;
}
