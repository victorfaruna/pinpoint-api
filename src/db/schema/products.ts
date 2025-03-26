import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  serial,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { users } from "./users";

type ItemOptions = {
  optionCategory: { type: String; required: true };
  optionName: { type: String; required: true };
};

export const stories = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  mainCategory: text("main_category").array().notNull(),
  category: text("category").array().notNull(),
  subCategory: text("sub_category").array(),
  options: jsonb("options").$type<ItemOptions[]>(),
  reviews: jsonb("reviews"),
  rating: integer("rating").default(0),

  // Then add product-specific fields
  price: numeric("price").notNull(),
  availableOnline: boolean("available_online").default(false),
  productUrl: text("product_url"),
  ships: boolean("ships").default(false),
  pickupAvailable: boolean("pickup_available").default(false),
  inShopOnly: boolean("in_shop_only").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
