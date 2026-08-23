import { isDev } from "@main/main";

// TODO 生产环境 URL 补充
export const APP_API_BASE_URL = isDev() ? "https://localhost" : "";