"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.locations = (0, pg_core_1.pgTable)("locations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    images: (0, pg_core_1.text)("images").array(),
    locationName: (0, pg_core_1.text)("location_name").notNull(),
    address: (0, pg_core_1.text)("address"),
});
