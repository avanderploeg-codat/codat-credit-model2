import { join, dirname } from "path";
import { Low } from "lowdb";
import { fileURLToPath } from "url";
import { JSONFile } from 'lowdb/node'

const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

export default db;