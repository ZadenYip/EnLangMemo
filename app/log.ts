import { app } from 'electron';
import log from 'electron-log/main';
import * as path from 'path';

export function logSetUp() {
    // Initialize Electron Log
    const logDir = path.join(
        path.dirname(app.getPath('exe')),
        'logs'
    );
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    log.transports.file.resolvePathFn = () => path.join(logDir, `${year}-${month}-${day}.log`);
    log.initialize();
}