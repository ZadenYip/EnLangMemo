import { IServicesWithOnlyObservables, IServicesWithoutObservables } from "electron-ipc-cat/common";
import * as service from "./ipc-service";

declare global {
  interface Window {
    observables: IServicesWithOnlyObservables<typeof service>;
    service: IServicesWithoutObservables<typeof service>;
  }
}