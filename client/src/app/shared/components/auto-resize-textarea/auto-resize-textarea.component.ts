import { Component, ElementRef, input, linkedSignal, output, viewChild } from "@angular/core";

@Component({
    selector: "app-auto-resize-textarea",
    standalone: true,
    templateUrl: "./auto-resize-textarea.component.html",
    styleUrl: "./auto-resize-textarea.component.scss",
})
export class AutoResizeTextareaComponent {
    /**
     * Placeholder text shown when textarea is empty.
     */
    readonly placeholder = input("");

    /**
     * Current textarea value controlled by parent component.
     */
    readonly value = input("");
    
    internalValue = linkedSignal(() => {
        const externalValue = this.value();
        this.textarea()!.nativeElement.value = externalValue;
        this.fitTextareaHeight();
        return externalValue;
    });

    /**
     * Emits changed textarea value.
     */
    readonly valueChange = output<string>();

    /**
     * Textarea element used for height calculation.
     */
    private readonly textarea =
        viewChild<ElementRef<HTMLTextAreaElement>>("textarea");

    /**
     * Emit value changes and expand textarea to fit content.
     */
    onInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.valueChange.emit(textarea.value);
        this.fitTextareaHeight(textarea);
    }

    /**
     * Expand textarea height immediately, including newly inserted blank lines.
     */
    private fitTextareaHeight(textarea = this.textarea()?.nativeElement): void {
        if (!textarea) {
            return;
        }
        const borderHeight = textarea.offsetHeight - textarea.clientHeight;
        textarea.style.height = "0";
        textarea.style.height = `${textarea.scrollHeight + borderHeight}px`;
    }
}
