import { inject, Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

@Injectable({
    providedIn: "root",
})
export class NotifyService {
    /** Material snack bar service. */
    private readonly snackBar = inject(MatSnackBar);

    /**
     * Show a snack bar notification with default Material config.
     * @param message Message text to display.
     */
    open(message: string, action?: string, config: MatSnackBarConfig = {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
    }): void {
        this.snackBar.open(message, action, config);
    }
}
