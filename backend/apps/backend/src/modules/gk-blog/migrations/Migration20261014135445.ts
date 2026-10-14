import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261014135445 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gk_post" drop constraint if exists "gk_post_slug_unique";`);
    this.addSql(`create table if not exists "gk_post" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "cover_url" text null, "body" text not null default '', "author" text null, "tags" jsonb null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "published_at" timestamptz null, "seo_title" text null, "seo_description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gk_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_gk_post_slug_unique" ON "gk_post" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_post_deleted_at" ON "gk_post" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_post_status_published_at" ON "gk_post" ("status", "published_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gk_post" cascade;`);
  }

}
