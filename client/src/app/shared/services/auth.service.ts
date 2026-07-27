import { Injectable, computed, inject, signal } from "@angular/core";
import Logger from "electron-log/renderer";
import { TranslateService } from "@ngx-translate/core";
import { NotifyService } from "./notify.service";
import type { AuthFailureReason, CurUserResponse } from "@main/oauth/auth-service-types";

export interface CurrentUserView {
    /** Current user ID from the OAuth server. */
    userId: string;
    /** Login ID used by the current user. */
    loginId: string;
    /** Nickname displayed in the toolbar. */
    nickname: string;
}

@Injectable({ providedIn: "root" })
export class AuthService {
    /** Notification service used for auth failure messages. */
    private readonly notifyService = inject(NotifyService);

    /** Translation service used to localize auth notifications. */
    private readonly translateService = inject(TranslateService);

    /** Current signed-in user shown in the UI. */
    readonly curUser = signal<CurrentUserView | null>(null);

    /** Current signed-in user consumed by templates. */
    readonly currentUser = this.curUser;

    /** Whether auth status is currently being loaded or changed. */
    readonly authBusy = signal(false);

    /** Auth status label translation key shown when no user name is available. */
    readonly authStatusLabel = computed(() => {
        if (this.authBusy()) {
            return "HEADER.AUTH.CHECKING";
        }

        return "HEADER.AUTH.NOT_LOGGED_IN";
    });

    /** Start OAuth login through the main process and refresh current user status. */
    async login(): Promise<void> {
        if (this.authBusy() || this.curUser()) {
            return;
        }

        this.authBusy.set(true);

        try {
            const curUserResponse = await window.service.auth.startLogin();
            this.applyAuthQueryResponse(curUserResponse);
        } catch (error) {
            // catch ipc errors not startLogin() errors
            Logger.error("Unexpected error in IPC", error);
            this.notifyAuthFailure("internal");
            this.curUser.set(null);
        } finally {
            this.authBusy.set(false);
        }
    }

    /**
     * send logout request to main process and clear current user status.
     * If logout fails, notify the user about the failure.
     * @returns Promise<void>
     */
    async logout(): Promise<void> {
        try {
            const revokeResponse = await window.service.auth.logout();
            if (!revokeResponse.success) {
                this.notifyAuthFailure(toAuthFailureKind(revokeResponse.error));
            }
        } catch (error) {
            Logger.error("unexpected error in IPC when revoking token", error);
            this.notifyAuthFailure("internal");
        }
        
        this.curUser.set(null);
    }

    /** Refresh current user status through the main process. */
    async refreshCurrentUser(): Promise<void> {
        this.authBusy.set(true);

        try {
            const curUserResponse = await window.service.auth.getCurUser();
            this.applyAuthQueryResponse(curUserResponse);
        } catch (error) {
            Logger.error("Failed to refresh current user", error);
            this.notifyAuthFailure("internal");
            this.curUser.set(null);
        } finally {
            this.authBusy.set(false);
        }
    }

    /**
     * Apply an auth query response to renderer state and notify on query failures.
     * @param response - Current-user query response returned from the main process.
     */
    private applyAuthQueryResponse(response: CurUserResponse): void {
        if (response.success) {
            this.curUser.set(response.user);
            return;
        }

        this.notifyAuthFailure(toAuthFailureKind(response.error));
        this.curUser.set(null);
    }

    /**
     * Notify the user about an auth failure at UI level.
     * @param kind - User-facing auth failure category.
     */
    private notifyAuthFailure(kind: AuthFailureKind): void {
        const messageKey = toAuthFailureMessageKey(kind);
        this.notifyService.open(this.translateService.instant(messageKey));
    }
}

/** User-facing auth failure category shown by the renderer. */
type AuthFailureKind = "network" | "server" | "internal";

/**
 * Map user-facing auth failure categories into localized message keys.
 * @param kind - User-facing auth failure category.
 * @returns Translation key displayed in notification.
 */
function toAuthFailureMessageKey(kind: AuthFailureKind): string {
    switch (kind) {
        case "network":
            return "HEADER.AUTH.NETWORK_ERROR";
        case "server":
            return "HEADER.AUTH.SERVER_INTERNAL_ERROR";
        case "internal":
            return "HEADER.AUTH.APP_INTERNAL_ERROR";
    }
}

/**
 * Map main-process auth failures into user-facing notification categories.
 * @param reason - Failure reason returned through IPC.
 * @returns User-facing auth failure category.
 */
function toAuthFailureKind(reason: AuthFailureReason | undefined): AuthFailureKind {
    switch (reason) {
        case "timeout":
        case "network_error":
        case "fetch_aborted":
        case "callback_timeout":
            return "network";
        case "unexpected_error":
        case undefined:
            return "internal";
        default:
            return "server";
    }
}
