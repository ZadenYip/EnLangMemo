import { getRepDb } from "@main/db/db.js";

/** Repetition database transaction handle used by push collector update helpers. */
export type RepTx = Parameters<Parameters<ReturnType<typeof getRepDb>["transaction"]>[0]>[0];
