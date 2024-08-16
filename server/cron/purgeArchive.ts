import type { Kysely } from "kysely";
import type { Database } from "schema";

/**
 * Deletes archived pages that no longer have paying users with it in their collection
 *
 * This task is currently disabled because preservation is important, but may be reenabled
 * if costs become exessive.
 */
export default function purgeArchive(db: Kysely<Database>) {}
