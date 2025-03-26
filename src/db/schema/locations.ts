import {
  pgTable,
  text,
  timestamp,
  jsonb,
  serial,
  integer,
} from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  images: text("images").array(),
  locationName: text("location_name").notNull(),
  address: text("address"),
  description: text("description"),
  categories: text("categories").array(),
  hoursOfOperation: jsonb("hours_of_operation"),
  menu: jsonb("menu"),
  coordinates: jsonb("coordinates"),
  poll: jsonb("poll"),
  partnerId: integer("partner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
