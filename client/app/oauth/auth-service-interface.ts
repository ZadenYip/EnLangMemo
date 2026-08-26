import { ProxyPropertyType } from "electron-ipc-cat/common";
import type { CurUserResponse, RevokeResponse } from "./auth-service-types.js";
export interface IAuthService {
    startLogin(): Promise<CurUserResponse>;
    logout(): Promise<RevokeResponse>;
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
