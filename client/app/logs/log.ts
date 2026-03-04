import { app } from 'electron';
import log from 'electron-log/main';
import * as path from 'path';

export function loggerSetUp(serve: boolean): void {
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
    log.transports.file.level = serve ? 'debug' : 'info';
    log.initialize();

}