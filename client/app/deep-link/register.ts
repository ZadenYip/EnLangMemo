// deep link 
// https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
import { handleAuthorizeCallback, OAUTH_CALLBACK_PATH } from "@main/oauth/oauth-pkce";
import { app } from "electron";
import Logger from "electron-log/main";
import { BrowserWindow } from "electron/main";

const APP_PROTOCOL = "enlangmemo";

/**
 * register custom protocol for the app,
 * so that the app can be opened with a link like "enlangmemo://"
 */
export function registerAppProtocol() {
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            // XX/electron.exe AppDir
            app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
                app.getAppPath(),
            ]);
        }
    } else {
        app.setAsDefaultProtocolClient(APP_PROTOCOL);
    }
}

export function registerWindowProtocol(getMainWindow: () => BrowserWindow | null) {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    } else {
        app.on("second-instance", (event, commandLine, _workingDirectory) => {
            if (getMainWindow()) {
                if (getMainWindow()!.isMinimized()) { getMainWindow()!.restore(); }
                getMainWindow()!.focus();
            }
            const url = commandLine.pop();
            dispatchDeepLink(url);
        });
    }
}

export function registerMacOSProtocol() {
    app.on("open-url", (event, url) => {
        dispatchDeepLink(url);
    });
}

function dispatchDeepLink(url: string | undefined) {
    Logger.info("received deep link");
    if (!url) {
        Logger.error("received deep link is undefined");
        return;
    }

    if (url.startsWith(OAUTH_CALLBACK_PATH)) {
        handleAuthorizeCallback(url);
    }
}