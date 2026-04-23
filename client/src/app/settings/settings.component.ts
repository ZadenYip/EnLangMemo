import { Component } from "@angular/core";
import { SidenavComponent } from "@render/shared/sidenav/sidenav-layout";
import { SETTINGS_ROUTES } from "./route";

@Component({
    selector: "app-settings",
    imports: [SidenavComponent],
    templateUrl: "./settings.component.html",
    styleUrl: "./settings.component.scss",
})
export class SettingsComponent {
    readonly routes = SETTINGS_ROUTES;
}
