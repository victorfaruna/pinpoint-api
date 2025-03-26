import { pgEnum } from "drizzle-orm/pg-core";

// Define enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "customer",
  "partner",
]);

export const businessTypeEnum = pgEnum("business_type", [
  "products",
  "services",
  "products & services",
]);
