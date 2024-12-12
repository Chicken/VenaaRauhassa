import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";

export type StoredSession = {
  sessionId: string;
  token: string;
  expiresOn: number;
};

if (!existsSync("./data")) mkdirSync("./data");
const db = new Database("./data/data.db");
db.pragma("synchronous = 1");
db.prepare(
  `
CREATE TABLE IF NOT EXISTS session (
    id INTEGER PRIMARY KEY,
    sessionId TEXT,
    token TEXT,
    expiresOn INTEGER
);    
`
).run();

export const sessionStore = {
  get: () => {
    const entry = db.prepare("SELECT sessionId, token, expiresOn FROM session LIMIT 1").get();
    if (!entry) return null;
    return entry as StoredSession;
  },
  set: (session: StoredSession) => {
    db.prepare("INSERT OR REPLACE INTO session VALUES (0, @sessionId, @token, @expiresOn)").run(
      session
    );
  },
};
