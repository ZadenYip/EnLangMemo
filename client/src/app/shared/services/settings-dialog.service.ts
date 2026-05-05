import { inject, Injectable } from "@angular/core";
import { ComponentType } from "@angular/cdk/portal";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";

@Injectable({
    providedIn: "root",
})
export class SettingsDialogService {
    /** Material dialog service. */
    private readonly dialog = inject(MatDialog);

    /**
     * Open a settings dialog with default size.
     * @param dialogComponent Dialog component to open.
     * @param config Optional dialog config overrides.
     */
    open<TComponent, TData = unknown, TResult = unknown>(
        dialogComponent: ComponentType<TComponent>,
        config: MatDialogConfig<TData> = {},
    ): MatDialogRef<TComponent, TResult> {
        return this.dialog.open(dialogComponent, {
            width: "50vw",
            minWidth: "50vw",
            maxWidth: "50vw",
            maxHeight: "70vh",
            ...config,
        });
    }
}
