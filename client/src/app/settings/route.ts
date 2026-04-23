import { Routes } from "@angular/router";
import { SettingsCollectionComponent } from "./collection/collection.component";

export const SETTINGS_PATHS = {
    collection: "collection",
} as const;

export const SETTINGS_ROUTES: Routes = [
    {
        path: SETTINGS_PATHS.collection,
        component: SettingsCollectionComponent,
        title: "PAGES.SETTINGS.COLLECTION.NAV_TITLE",
    },
    {
        path: "",
        redirectTo: SETTINGS_PATHS.collection,
        pathMatch: "full",
    },
];
