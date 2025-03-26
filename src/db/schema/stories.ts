import { pgTable, text, timestamp, serial, integer } from "drizzle-orm/pg-core";

import { users } from "./users";
import { locations } from "./locations";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  locationId: integer("location_id").references(() => locations.id),
  media: text("media").notNull(),
  mediaType: text("media_type").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
});
