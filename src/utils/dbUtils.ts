import getDb from "@/services/dbService";
import type { DB_NAME } from "@/types/types";

export function getValueFromDb(dbName: DB_NAME, key: string) {
    const db = getDb().openDB({ name: dbName });
    return db.get(key)
}