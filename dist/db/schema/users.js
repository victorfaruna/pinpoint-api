"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.follows = exports.users = exports.businessTypeEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Define enums
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", [
    "admin",
    "customer",
    "partner",
]);
exports.businessTypeEnum = (0, pg_core_1.pgEnum)("business_type", [
    "products",
    "services",
    "products & services",
]);
// Define the User table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    firstName: (0, pg_core_1.text)("first_name").notNull(),
    lastName: (0, pg_core_1.text)("last_name").notNull(),
    username: (0, pg_core_1.varchar)("username", { length: 255 }).notNull().unique(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    role: (0, exports.userRoleEnum)("role").notNull(),
    city: (0, pg_core_1.text)("city").notNull(),
    state: (0, pg_core_1.text)("state").notNull(),
    avatarUrl: (0, pg_core_1.text)("avatar_url").default("06450da9-903c-46ca-abd0-59864e8dc266_1729665407294-586722170.jpg"),
    verificationCode: (0, pg_core_1.text)("verification_code"),
    verificationCodeExpires: (0, pg_core_1.timestamp)("verification_code_expires"),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    deleted: (0, pg_core_1.boolean)("deleted").default(false),
    notification: (0, pg_core_1.jsonb)("notification"),
});
exports.follows = (0, pg_core_1.pgTable)("follows", {
    followerId: (0, pg_core_1.integer)("follower_id").references(() => exports.users.id),
    followingId: (0, pg_core_1.integer)("following_id").references(() => exports.users.id),
}, (t) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [t.followerId, t.followingId] }),
}));
