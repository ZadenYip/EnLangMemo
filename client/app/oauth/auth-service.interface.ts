import { ProxyPropertyType } from "electron-ipc-cat/common";
import type { CurUserResponse } from "./auth-service.types";
export interface IAuthService {
    startLogin(): Promise<CurUserResponse>;
    getCurUser(): Promise<CurUserResponse>;
}

export const AuthServiceIPCDescriptor = {
    channel: "authService",
    properties: {
        startLogin: ProxyPropertyType.Function,
        getCurUser: ProxyPropertyType.Function,
    },
};
