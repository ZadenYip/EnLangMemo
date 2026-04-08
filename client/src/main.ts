import "electron-ipc-cat/fixContextIsolation"; // Ensure ipc works in context-isolated environments

import { enableProdMode, provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideRouter } from "@angular/router";

import { AppComponent } from "./app/app.component";
import { APP_CONFIG } from "./environments/environment";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { APP_ROUTES } from "@render/root-route";

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),provideHttpClient(withInterceptorsFromDi()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: "./assets/i18n/",
        suffix: ".json"
      }),
      fallbackLang: "en",
      lang: "en"
    }),
    provideRouter(APP_ROUTES)
  ]
}).catch(err => console.error(err));
