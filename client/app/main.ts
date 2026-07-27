import { app, BrowserWindow, screen } from "electron";
import * as path from "path";
import * as fs from "fs";
import { registerAllIPCHandlers } from "./ipc";
import { loggerSetUp } from "./logs/log";
import { loadAppConfig } from "./db/config/config";
import { initDatabase } from "./db/db";
import { getUserDataDir } from "./paths";
import { registerAppProtocol, registerWindowProtocol } from "./deep-link/register";

export function isDev(): boolean {
    return !app.isPackaged;
}

export let mainWindow: BrowserWindow | null = null;
const args = process.argv.slice(1),
    serve = args.some((val) => val === "--serve");

// must keep the order of the following two function calls
registerAppProtocol();
registerWindowProtocol(() => { return mainWindow; });


app.whenReady().then(() => {
    initApp();

    // Re-create a window in the app 
    // when the dock icon is clicked and there are no other windows open (macOS specific).
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});


function initApp() {
    loggerSetUp(serve);
    
    // ensure user_data directory exists
    const userDataDir = getUserDataDir();
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir);
    }

    const appConfig = loadAppConfig();
    initDatabase(appConfig);
    createWindow();
    registerAllIPCHandlers();
}

function createWindow(): BrowserWindow {
    const size = screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    mainWindow = new BrowserWindow({
        x: 0,
        y: 0,
        title: "EnLangMemo",
        width: size.width,
        height: size.height,
        webPreferences: {
            nodeIntegration: false,
            allowRunningInsecureContent: !serve,
            contextIsolation: true,
            webSecurity: !serve,
            preload: path.join(__dirname, "preload.js"),
        },
    });
    mainWindow.on("page-title-updated", (event) => {
        // prevent title from being changed by renderer process
        event.preventDefault();
    });

    if (serve) {
        import("electron-debug").then((debug) => {
            debug.default({ isEnabled: true, showDevTools: true });
        });

        import("electron-reloader").then((reloader) => {
            const reloaderFn = reloader.default || reloader;
            reloaderFn(module);
        });
        mainWindow.loadURL("http://localhost:5173");
    } else {
        // Path when running electron executable
        let pathIndex = "./browser/index.html";

        if (fs.existsSync(path.join(__dirname, "../dist/browser/index.html"))) {
            // Path when running electron in local folder
            pathIndex = "../dist/browser/index.html";
        }

        const fullPath = path.join(__dirname, pathIndex);
        const url = `file://${path.resolve(fullPath).replace(/\\/g, "/")}`;
        mainWindow.loadURL(url);
    }

    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    return mainWindow;
}
