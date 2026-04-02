import { Component, input } from "@angular/core";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { Routes, RouterOutlet, RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

interface RouteInfo {
    path: string;
    title: string;
}

@Component({
    selector: "app-sidenav-layout",
    imports: [
        MatSidenavModule,
        MatListModule,
        RouterOutlet,
        RouterLink,
        TranslateModule,
    ],
    templateUrl: "./sidenav-layout.html",
    styleUrl: "./sidenav-layout.scss",
})
export class SidenavComponent {
    readonly routes = input<Routes>();

    public getRoutes(): RouteInfo[] {
        const routeInfos = this.routes()?.map<RouteInfo>(route => {
            return {
                path: route.path ?? "",
                title: route.title as string
            }
        });

        return routeInfos ?? [];
    }
}
