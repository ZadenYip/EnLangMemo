import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import Logger from 'electron-log/renderer';

@Injectable({
    providedIn: 'root',
})
export class FileService {

    constructor(private sanitizer: DomSanitizer) {}

    /**
     * Creates an object URL from the selected file and revokes the previous one.
     * @param event - File selection event
     * @param safeUrl - Previous SafeUrl to revoke
     * @param handle - Optional handler for the selected file
     * @returns - New SafeUrl for the selected file
     */
    getURLFromInputElem(
        event: Event,
        safeUrl: SafeUrl,
        handle?: (file: File) => void,
    ): SafeUrl {
        const input = event.target as HTMLInputElement;

        // Ensure a file is selected
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const objectUrl = URL.createObjectURL(file);

            const urlString = this.sanitizer.sanitize(
                SecurityContext.URL,
                safeUrl,
            );
            if (urlString !== '') {
                Logger.info('Revoking previous object URL:', urlString);
                URL.revokeObjectURL(urlString!);
            }

            handle?.(file);

            Logger.info('Created object URL for file:', objectUrl);
            return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        }

        return '';
    }

    revokeURL(safeUrl: SafeUrl): void {
        const urlString = this.sanitizer.sanitize(SecurityContext.URL, safeUrl);
        if (urlString !== '') {
            Logger.info('Revoking object URL:', urlString);
            URL.revokeObjectURL(urlString!);
        }
    }
}
