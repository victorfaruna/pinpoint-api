"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stories = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const locations_1 = require("./locations");
exports.stories = (0, pg_core_1.pgTable)("stories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .references(() => users_1.users.id, { onDelete: "cascade" })
        .notNull(),
    locationId: (0, pg_core_1.integer)("location_id").references(() => locations_1.locations.id),
    media: (0, pg_core_1.text)("media").notNull(),
    mediaType: (0, pg_core_1.text)("media_type").notNull(),
    caption: (0, pg_core_1.text)("caption"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    views: (0, pg_core_1.integer)("views").default(0),
    likes: (0, pg_core_1.integer)("likes").default(0),
});
