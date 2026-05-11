import {
    Component,
    ElementRef,
    HostListener,
    inject,
    input,
    output,
    signal,
} from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

export interface SelectDropdownOption {
    value: string;
    /**
     * Plain text label for the option. If not provided.
     */
    label?: string;
    /**
     * i18n key for the option label. Used if `label` is not provided.
     */
    labelKey?: string;
}

@Component({
    selector: "app-select-dropdown",
    imports: [TranslateModule],
    templateUrl: "./select-dropdown.component.html",
    styleUrl: "./select-dropdown.component.scss",
})
export class SelectDropdownComponent {
    /**
     * Root element reference for click-outside detection.
     */
    private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);
    /**
     * Translation service for resolving i18n labels.
     */
    private readonly translate = inject(TranslateService);

    /**
     * Available options for the dropdown.
     */
    options = input.required<SelectDropdownOption[]>();

    /**
     * Currently selected option value.
     */
    selectedOption = input.required<SelectDropdownOption>();

    /**
     * Emits when the selected option changes.
     */
    selectedOptionChange = output<SelectDropdownOption>();


    /**
     * Whether the dropdown menu is open.
     */
    isMenuOpen = signal(false);

    /**
     * Toggle the dropdown menu state.
     */
    toggleMenu(): void {
        this.isMenuOpen.update((open) => !open);
    }

    /**
     * Close the menu when clicking outside the component.
     */
    @HostListener("document:click", ["$event.target"])
    onDocumentClick(target: EventTarget | null): void {
        if (!this.isMenuOpen()) {
            return;
        }

        const hostElement = this.hostRef.nativeElement;
        if (target instanceof Node && !hostElement.contains(target)) {
            this.isMenuOpen.set(false);
        }
    }

    /**
     * Select an option and close the dropdown menu.
     */
    selectOption(option: SelectDropdownOption): void {
        this.selectedOptionChange.emit(option);
        this.isMenuOpen.set(false);
    }

    /**
     * Resolve option display label from plain text or i18n key.
     */
    resolveLabel(option: SelectDropdownOption): string {
        if (option.label) {
            return option.label;
        }
        if (option.labelKey) {
            return this.translate.instant(option.labelKey);
        }
        return "";
    }

}

export function createEmptyOption(): SelectDropdownOption {
    return {
        value: "",
        label: "",
    };
}