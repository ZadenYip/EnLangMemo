import type {
  IServicesWithOnlyObservables,
  IServicesWithoutObservables,
} from "electron-ipc-cat/common";
import type * as service from "./ipc-service.js";

declare global {
  interface Window {
    observables: IServicesWithOnlyObservables<typeof service>;
    service: IServicesWithoutObservables<typeof service>;
  }
}

export {};
