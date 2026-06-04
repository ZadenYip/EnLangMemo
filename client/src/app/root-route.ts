import { Routes } from "@angular/router";
import { BrowseComponent } from "@render/browse/browse.component";
import { HomeComponent } from "@render/home/home.component";
import { ImmerseComponent } from "@render/immerse/immerse.component";
import { SettingsComponent } from "@render/settings/settings.component";
import { SETTINGS_ROUTES } from "@render/settings/route";
import { PageNotFoundComponent } from "@render/shared/components";
import { BROWSE_ROUTES } from "@render/browse/route";
import { ProcessingComponent } from "./processing/processing.component";
import { LearnComponent } from "./home/sub/learn/learn.component";
import { LEARN_ROUTES } from "./home/sub/learn/route";

export const APP_PATHS = {
    deck: "deck",
    processing: "processing",
    immerse: "immerse",
    browse: "browse",
    settings: "settings",
    stats: "stats",
} as const;

export const APP_ROUTES: Routes = [
    {
        path: "",
        redirectTo: APP_PATHS.deck,
        pathMatch: "full",
    },
    {
        path: APP_PATHS.processing,
        component: ProcessingComponent,
    },
    {
        path: APP_PATHS.deck,
        component: HomeComponent,
    },
    {
        path: `${APP_PATHS.deck}/:deck-id`,
        component: LearnComponent,
        children: LEARN_ROUTES
    },
    {
        path: APP_PATHS.immerse,
        component: ImmerseComponent,
    },
    {
        path: APP_PATHS.browse,
        component: BrowseComponent,
        children: BROWSE_ROUTES,
    },
    {
        path: APP_PATHS.settings,
        component: SettingsComponent,
        children: SETTINGS_ROUTES,
    },
    {
        path: APP_PATHS.stats,
        component: PageNotFoundComponent,
    },
];
