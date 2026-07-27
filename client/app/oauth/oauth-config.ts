import { isDev } from "@main/main";

// TODO 生产环境 URL 补充
export const APP_API_BASE_URL = isDev() ? "https://localhost" : "";
export const CLIENT_ID = isDev() ? "00000000-0000-0000-0000-000000000010" : "";

/** Base URL of the OAuth endpoints used by PKCE authorization. */
export const OAUTH_API_BASE_URL = `${APP_API_BASE_URL}/v1/oauth`;
