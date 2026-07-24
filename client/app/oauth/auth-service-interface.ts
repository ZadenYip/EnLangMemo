import { ProxyPropertyType } from "electron-ipc-cat/common";
import type { CurUserResponse } from "./auth-service-types";
export interface IAuthService {
    startLogin(): Promise<CurUserResponse>;
    logout(): Promise<CurUserResponse>;
    getCurUser(): Promise<CurUserResponse>;
}

export const AuthServiceIPCDescriptor = {
    channel: "authService",
    properties: {
        startLogin: ProxyPropertyType.Function,
        logout: ProxyPropertyType.Function,
        getCurUser: ProxyPropertyType.Function,
    },
};
