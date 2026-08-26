import type { MatDialog } from "@angular/material/dialog";
import type { TranslateService } from "@ngx-translate/core";
import type { NotifyService } from "../../../shared/services/notify.service.js";

export interface FlowDeps {
    dialog: MatDialog;
    notify: NotifyService;
    translate: TranslateService;
}
