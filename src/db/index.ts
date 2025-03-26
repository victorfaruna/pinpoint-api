import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";

import * as schema from "./schema";

dotenv.config();
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL || "", { prepare: false });
export const db = drizzle({ client, schema });
