import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { DictionarySelectionService } from './selection.service';
import { DictionaryWindowService } from '../dictionary-window.service';

/**
 * It should be attached to any element that contains text
 * which you expect users to select for dictionary lookup.
 * Only supports selection within a single text node.
 */
@Directive({
    selector: '[appDictionarySelectionSource]',
    standalone: true,
})
export class DictionarySelectionSourceDirective {

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly selectionService = inject(DictionarySelectionService);
    private readonly dictionaryWindowService = inject(DictionaryWindowService);

    @HostListener('mouseup')
    onMouseUp(): void {
        this.processTextSelection();
    }

    private processTextSelection(): void {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const selectedText = this.cleanWhitespace(selection.toString());
        if (!selectedText) {
            return;
        }

        const range = selection.getRangeAt(0);
        // Only proceed if the selection is within a single text node inside the host element.
        // This is a simplification that allows us to avoid complex DOM manipulations.
        const isInOneNode = this.isSelectionInOneNode(range);
        if (!isInOneNode) {
            return;
        }
        // At this point, we have a valid selection within a single text node.
        const selectionContainer = range.startContainer;

        const contextSentence = this.extractContextSentence(selectionContainer);
        this.selectionService.updateSelection(
            selectedText,
            contextSentence || selectedText,
        );
        this.dictionaryWindowService.show();
    }

    /**
     * Wheather the selection is within a single text node.
     */
    private isSelectionInOneNode(range: Range): boolean {
        const hostElement = this.host.nativeElement;
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        if (!hostElement.contains(startContainer) || !hostElement.contains(endContainer)) {
            return false;
        }

        return startContainer === endContainer;
    }

    /**
     * Extracts the sentence context for a given range.
     * @param range The text range containing the user's selection.
     * @returns The whole node text containing the selection
     */
    private extractContextSentence(node: Node): string {
        const contextNode = node;
        const contextRaw = contextNode.textContent ?? '';
        if (!contextRaw) {
            return '';
        }

        return this.cleanWhitespace(contextRaw);
    }

    private cleanWhitespace(text: string): string {
        return text.replace(/\s+/g, ' ').trim();
    }
}
