import { Routes } from "@angular/router";
import { LearnStartComponent } from "./learn-start.component";
import { LearnCardComponent } from "./learn-card.component";
import { LearnCompletedComponent } from "./learn-completed.component";


const ROUTES = {
    start: "start",
    learning: "learning",
    completed: "completed",
} as const;

export const LEARN_ROUTES: Routes = [
        {
            path: "",
            redirectTo: ROUTES.start,
            pathMatch: "full",
        },
        {
            path: ROUTES.start,
            component: LearnStartComponent,
        },
        {
            path: ROUTES.learning,
            component: LearnCardComponent,
        },
        {
            path: ROUTES.completed,
            component: LearnCompletedComponent,
        },
]