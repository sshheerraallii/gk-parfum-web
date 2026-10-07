import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261007122606 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gk_setting" drop constraint if exists "gk_setting_key_unique";`);
    this.addSql(`create table if not exists "gk_setting" ("id" text not null, "key" text not null, "value" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gk_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_gk_setting_key_unique" ON "gk_setting" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gk_setting_deleted_at" ON "gk_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gk_setting" cascade;`);
  }

}
