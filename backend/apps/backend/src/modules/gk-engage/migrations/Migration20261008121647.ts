import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008121647 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gk_subscriber" drop constraint if exists "gk_subscriber_email_unique";`);
    this.addSql(`create table if not exists "gk_message" ("id" text not null, "name" text not null, "email" text not null, "order_ref" text null, "message" text not null, "status" text check ("status" in ('new', 'replied', 'archived')) not null default 'new', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gk_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_message_deleted_at" ON "gk_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "gk_review" ("id" text not null, "product_handle" text null, "name" text not null, "email" text not null, "rating" integer not null, "title" text null, "body" text not null, "verified" boolean not null default false, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gk_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_review_deleted_at" ON "gk_review" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "gk_search" ("id" text not null, "query" text not null, "keywords" jsonb not null, "results" integer not null default 0, "source" text not null default 'matcher', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gk_search_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_search_deleted_at" ON "gk_search" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "gk_subscriber" ("id" text not null, "email" text not null, "phone" text null, "source" text not null default 'popup', "in_prize_draw" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gk_subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_gk_subscriber_email_unique" ON "gk_subscriber" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_subscriber_deleted_at" ON "gk_subscriber" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gk_message" cascade;`);

    this.addSql(`drop table if exists "gk_review" cascade;`);

    this.addSql(`drop table if exists "gk_search" cascade;`);

    this.addSql(`drop table if exists "gk_subscriber" cascade;`);
  }

}
