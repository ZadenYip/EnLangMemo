import { Routes } from "@angular/router";
import { BrowseComponent } from "@render/browse/browse.component";
import { HomeComponent } from "@render/home/home.component";
import { ImmerseComponent } from "@render/immerse/immerse.component";
import { PageNotFoundComponent } from "@render/shared/components";

export const APP_PATHS = {
    home: "home",
    immerse: "immerse",
    browse: "browse",
    stats: "stats",
} as const;

export const APP_ROUTES: Routes = [
    {
        path: "",
        redirectTo: APP_PATHS.home,
        pathMatch: "full",
    },
    {
        path: APP_PATHS.home,
        component: HomeComponent,
    },
    {
        path: APP_PATHS.immerse,
        component: ImmerseComponent,
    },
    {
        path: APP_PATHS.browse,
        component: BrowseComponent,
    },
    {
        path: APP_PATHS.stats,
        component: PageNotFoundComponent,
    },
];
