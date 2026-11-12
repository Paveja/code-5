import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./stayfinder.db";
const databasePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl;

const globalForDatabase = globalThis as typeof globalThis & {
  stayfinderSqlite?: Database.Database;
};

const sqlite = globalForDatabase.stayfinderSqlite ?? new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.stayfinderSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite, schema };
