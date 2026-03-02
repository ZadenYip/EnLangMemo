import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DictionaryWindowService {
    private readonly _visible = signal(false);
    readonly visible = this._visible.asReadonly();

    show(): void {
        this._visible.set(true);
    }

    hide(): void {
        this._visible.set(false);
    }

}

