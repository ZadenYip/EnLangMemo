import { Routes } from "@angular/router";
import { CollectionsManagerComponent } from "./collections-manager/cols.manager.component";

export const SETTINGS_PATHS = {
    cols_manager_setting: "cols_manager_setting",
    col_config: "col_config"
} as const;

export const SETTINGS_ROUTES: Routes = [
    {
        path: SETTINGS_PATHS.cols_manager_setting,
        component: CollectionsManagerComponent,
        title: "PAGES.SETTINGS.COLLECTIONS_MANAGER.NAV_TITLE",
    },
    {
        path: "",
        redirectTo: SETTINGS_PATHS.cols_manager_setting,
        pathMatch: "full",
    },
];
