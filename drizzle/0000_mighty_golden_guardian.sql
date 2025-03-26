CREATE TYPE "public"."business_type" AS ENUM('products', 'services', 'products & services');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'customer', 'partner');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"images" text[],
	"location_name" text NOT NULL,
	"address" text,
	"description" text,
	"categories" text[],
	"hours_of_operation" jsonb,
	"menu" jsonb,
	"coordinates" jsonb,
	"poll" jsonb,
	"partner_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"images" text[] NOT NULL,
	"main_category" text[] NOT NULL,
	"category" text[] NOT NULL,
	"sub_category" text[],
	"options" jsonb,
	"reviews" jsonb,
	"rating" integer DEFAULT 0,
	"price" numeric NOT NULL,
	"available_online" boolean DEFAULT false,
	"product_url" text,
	"ships" boolean DEFAULT false,
	"pickup_available" boolean DEFAULT false,
	"in_shop_only" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"location_id" integer,
	"media" text NOT NULL,
	"media_type" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" integer,
	"following_id" integer,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"avatar_url" text DEFAULT '06450da9-903c-46ca-abd0-59864e8dc266_1729665407294-586722170.jpg',
	"verification_code" text,
	"verification_code_expires" timestamp,
	"is_verified" boolean DEFAULT false,
	"deleted" boolean DEFAULT false,
	"notification" jsonb,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;