import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: "app-file-input",
    imports: [MatButtonModule, MatIconModule, TranslateModule],
    templateUrl: "./file-input.component.html",
    styleUrl: "./file-input.component.scss",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileInputComponent),
            multi: true,
        },
    ],
})
export class FileInputComponent implements ControlValueAccessor {

    private _onTouch = () => {
        // dummy function
    };
    private _onChange = (_value: string) => {
        // dummy function
    };

    label = input<string>();
    extension = input<string>("*");
    protected selectedFilePath = signal<string>("");
    protected isDisabled = signal<boolean>(false);

    protected async onSelectFile(): Promise<void> {
        if (this.isDisabled()) {
            return;
        }

        const selectedPath = await window.service.dialog.showOpenDialog(
            "openFile",
            [this.extension()],
        );

        if (!selectedPath) {
            return;
        }

        this.selectedFilePath.set(selectedPath);
        this._onChange(selectedPath);
    }

    registerOnChange(fn: (value: string) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }

    writeValue(obj: unknown): void {
        this.selectedFilePath.set(typeof obj === "string" ? obj : "");
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }

}
