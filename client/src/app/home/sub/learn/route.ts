import { Routes } from "@angular/router";
import { LearnStartComponent } from "./learn-start.component";
import { LearnCardComponent } from "./learn-card.component";
import { LearnCompletedComponent } from "./learn-completed.component";


export const LEARN_PATHS = {
    start: "start",
    learning: "learning",
    completed: "completed",
} as const;

export type LearnPath = (typeof LEARN_PATHS)[keyof typeof LEARN_PATHS];

export const LEARN_ROUTES: Routes = [
    {
        path: "",
        redirectTo: LEARN_PATHS.start,
        pathMatch: "full",
    },
    {
        path: LEARN_PATHS.start,
        component: LearnStartComponent,
    },
    {
        path: LEARN_PATHS.learning,
        component: LearnCardComponent,
    },
    {
        path: LEARN_PATHS.completed,
        component: LearnCompletedComponent,
    },
];
