import { Injectable, signal } from '@angular/core';

export interface DictionarySelection {
    selectedText: string;
    contextSentence: string;
}

@Injectable({ providedIn: 'root'})
export class DictionarySelectionService {
    private readonly _selection = signal<DictionarySelection>({
        selectedText: '',
        contextSentence: '',
    });

    readonly selection = this._selection.asReadonly();

    updateSelection(selectedText: string, contextSentence: string): void {
        this._selection.set({
            selectedText: selectedText.trim(),
            contextSentence: contextSentence.trim(),
        });
    }
}
