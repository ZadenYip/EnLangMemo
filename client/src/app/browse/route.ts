import { Routes } from "@angular/router";
import { DicImportComponent } from "./dic-import/dic-import.component";

export const BROSWE_PATHS = {
    dictionary: "dictionary-import",
} as const;

export const BROWSE_ROUTES: Routes = [
    {
        path: BROSWE_PATHS.dictionary,
        component: DicImportComponent,
        title: "PAGES.BROWSE.ROUTES.DIC_IMPORT"
    }
]