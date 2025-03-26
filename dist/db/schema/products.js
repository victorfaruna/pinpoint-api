"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stories = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.stories = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .references(() => users_1.users.id)
        .notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    images: (0, pg_core_1.text)("images").array().notNull(),
    mainCategory: (0, pg_core_1.text)("main_category").array().notNull(),
    category: (0, pg_core_1.text)("category").array().notNull(),
    subCategory: (0, pg_core_1.text)("sub_category").array(),
    options: (0, pg_core_1.jsonb)("options").$type(),
    reviews: (0, pg_core_1.jsonb)("reviews"),
    rating: (0, pg_core_1.integer)("rating").default(0),
    // Then add product-specific fields
    price: (0, pg_core_1.numeric)("price").notNull(),
    availableOnline: (0, pg_core_1.boolean)("available_online").default(false),
    productUrl: (0, pg_core_1.text)("product_url"),
    ships: (0, pg_core_1.boolean)("ships").default(false),
    pickupAvailable: (0, pg_core_1.boolean)("pickup_available").default(false),
    inShopOnly: (0, pg_core_1.boolean)("in_shop_only").default(false),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
