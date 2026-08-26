import { SyncRpcErrorCode } from "@main/sync/sync-service-types.js";
import { NotifyService } from "@render/shared/services/notify.service.js";
import { TranslateService } from "@ngx-translate/core";

export interface NotifyDeps {
    notify: NotifyService
    translate: TranslateService
}
export function notifyRpcError(deps: NotifyDeps, code: SyncRpcErrorCode): void {
    switch (code) {
        case "unauthenticated":
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.UNAUTHENTICATED"));
            return;
        case "deadline_exceeded":
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.DEADLINE_EXCEEDED"));
            return;
        case "unavailable":
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.UNAVAILABLE"));
            return;
        case "resource_exhausted":
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.RESOURCE_EXHAUSTED"));
            return;
        case "permission_denied":
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.PERMISSION_DENIED"));
            return;
        case "invalid_argument":
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.INVALID_ARGUMENT"));
            return;
        default:
            deps.notify.open(deps.translate.instant("SYNC.ERRORS.UNKNOWN"));
    }
}
