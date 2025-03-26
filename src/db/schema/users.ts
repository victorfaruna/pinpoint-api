import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  serial,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enum";

// Define the User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  avatarUrl: text("avatar_url").default(
    "06450da9-903c-46ca-abd0-59864e8dc266_1729665407294-586722170.jpg"
  ),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
  isVerified: boolean("is_verified").default(false),
  deleted: boolean("deleted").default(false),
  notification: jsonb("notification"),
});

export const follows = pgTable(
  "follows",
  {
    followerId: integer("follower_id").references(() => users.id),
    followingId: integer("following_id").references(() => users.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
  })
);
