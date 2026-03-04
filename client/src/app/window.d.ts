export {};

declare global {
  interface Window {
    electron: {
      webUtils: {
        getPathForFile: (file: File) => string;
      }
    }
  }
}