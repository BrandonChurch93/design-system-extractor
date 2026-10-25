CREATE TYPE "public"."blocked_reason" AS ENUM('bot', 'login', 'unreachable', 'robots', 'budget', 'busy', 'visitor-cap', 'invalid-url', 'private-address');--> statement-breakpoint
CREATE TYPE "public"."event_level" AS ENUM('info', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('pending', 'captured', 'failed');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'complete', 'blocked', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('queue', 'discover', 'select', 'capture', 'tokens', 'components', 'previews', 'checks', 'drift', 'exports', 'done');--> statement-breakpoint
CREATE TABLE "run_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"stage" "stage" NOT NULL,
	"substage" text,
	"level" "event_level" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "run_pages" (
	"id" text NOT NULL,
	"run_id" text NOT NULL,
	"url" text NOT NULL,
	"path" text NOT NULL,
	"reason" text NOT NULL,
	"template_group" text,
	"template_size" integer,
	"selected" boolean DEFAULT false NOT NULL,
	"order" integer NOT NULL,
	"status" "page_status" DEFAULT 'pending' NOT NULL,
	"node_count" integer DEFAULT 0 NOT NULL,
	"capture_desktop_key" text,
	"capture_mobile_key" text,
	"title" text DEFAULT '' NOT NULL,
	"h1" text DEFAULT '' NOT NULL,
	CONSTRAINT "run_pages_run_id_id_pk" PRIMARY KEY("run_id","id")
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"host" text NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"blocked_reason" "blocked_reason",
	"blocked_detail" jsonb,
	"owner_id" text,
	"visitor_id" text NOT NULL,
	"byo_key" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"page_cap" integer NOT NULL,
	"include_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"viewports" text[] DEFAULT '{desktop,mobile}'::text[] NOT NULL,
	"pipeline_version" text NOT NULL,
	"document" jsonb NOT NULL,
	"stats" jsonb,
	"cost" jsonb,
	"framework_hint" text,
	"is_showcase" boolean DEFAULT false NOT NULL,
	"unpublished" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"retention_until" timestamp with time zone,
	"qa_frozen" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"current_period_end" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" text PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"runs_total" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_pages" ADD CONSTRAINT "run_pages_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "run_events_run_id_idx" ON "run_events" USING btree ("run_id","id");--> statement-breakpoint
CREATE INDEX "runs_host_idx" ON "runs" USING btree ("host");--> statement-breakpoint
CREATE INDEX "runs_visitor_created_idx" ON "runs" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "runs_status_idx" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "runs_retention_idx" ON "runs" USING btree ("retention_until");