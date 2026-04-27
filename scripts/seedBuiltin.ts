import { initDb } from "../server/db.js";
import { importBuiltinCases } from "../server/services/importBuiltin.js";

initDb();
const overwrite = process.argv.includes("--overwrite");
const result = importBuiltinCases({ overwrite });
console.log(result);
