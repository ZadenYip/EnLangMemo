import { generateUUIDV7 } from "@main/db/import/utils.js";
import { getCurAccountDir } from "@main/paths.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import * as os from "os";
import path from "path/win32";

interface DeviceInfo {
    deviceId: Buffer;
    deviceName: string;
}

const infoFileName = "device_info.json";

export function getDeviceInfo(): DeviceInfo {
    const dir = getCurAccountDir();
    const infoPath = path.join(dir, infoFileName);

    if (!existsSync(infoPath)) {
        const deviceInfo = genDeviceInfo();
        const infoStr = JSON.stringify({
            deviceId: deviceInfo.deviceId.toString("hex"),
            deviceName: deviceInfo.deviceName
        });
        writeFileSync(infoPath, infoStr, "utf-8");
        return deviceInfo;
    }

    const infoStr = readFileSync(infoPath, "utf-8");
    let infoObj: DeviceInfo
    try {
        infoObj = JSON.parse(infoStr) as DeviceInfo;
    } catch (error) {
        if (error instanceof SyntaxError) {
            const deviceInfo = genDeviceInfo();
            writeDeviceInfo(deviceInfo);
            return deviceInfo;
        }
        throw error;
    }
    return infoObj;
}

function writeDeviceInfo(deviceInfo: DeviceInfo): void {
    const dir = getCurAccountDir();
    const deviceInfoPath = path.join(dir, infoFileName);
    const infoStr = JSON.stringify(deviceInfo);
    writeFileSync(deviceInfoPath, infoStr, "utf-8");
}

function genDeviceInfo(): DeviceInfo {
    const deviceId = generateUUIDV7();
    const deviceName = os.hostname();
    return {
        deviceId,
        deviceName
    }
}