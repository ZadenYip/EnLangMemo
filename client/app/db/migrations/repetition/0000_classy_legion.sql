CREATE TABLE `cards` (
	`id` blob PRIMARY KEY NOT NULL,
	`note_id` blob NOT NULL,
	`deck_id` blob NOT NULL,
	`usn` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`difficulty` real NOT NULL,
	`stability` real NOT NULL,
	`scheduled_days` integer NOT NULL,
	`due` integer NOT NULL,
	`last_review` integer,
	`lapses` integer NOT NULL,
	`learning_steps` integer NOT NULL,
	`repetitions` integer NOT NULL,
	`state` integer NOT NULL,
	`queue` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_cards_sched` ON `cards` (`deck_id`,`queue`,`due`);--> statement-breakpoint
CREATE INDEX `ix_cards_usn` ON `cards` (`usn`);--> statement-breakpoint
CREATE INDEX `ix_cards_nid` ON `cards` (`note_id`);--> statement-breakpoint
CREATE TABLE `collection` (
	`id` blob PRIMARY KEY NOT NULL,
	`sqlite_schema_version` integer NOT NULL,
	`last_sync_time` integer DEFAULT 0 NOT NULL,
	`sync_cursor_usn` integer DEFAULT 0 NOT NULL,
	`usn` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`config` jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decks` (
	`id` blob PRIMARY KEY NOT NULL,
	`usn` integer NOT NULL,
	`name` text NOT NULL,
	`updated_at` integer NOT NULL,
	`new_cards_per_day` integer DEFAULT 20 NOT NULL,
	`new_learned_today` integer DEFAULT 0 NOT NULL,
	`learned_today` integer DEFAULT 0 NOT NULL,
	`reviewed_today` integer DEFAULT 0 NOT NULL,
	`config` jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dic_note_map` (
	`map_id` blob PRIMARY KEY NOT NULL,
	`note_type_id` blob NOT NULL,
	`usn` integer NOT NULL,
	`mapping` jsonb NOT NULL,
	FOREIGN KEY (`note_type_id`) REFERENCES `note_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note_types` (
	`id` blob PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`preset_template_id` integer DEFAULT 0 NOT NULL,
	`usn` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`note_template` jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` blob PRIMARY KEY NOT NULL,
	`note_type_id` blob NOT NULL,
	`usn` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sense_id` integer,
	`sort_field` text,
	`search_fields` text,
	`fields` jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_notes_usn` ON `notes` (`usn`);--> statement-breakpoint
CREATE TABLE `processing_notes` (
	`id` blob PRIMARY KEY NOT NULL,
	`note_type_id` blob NOT NULL,
	`usn` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sense_id` integer,
	`fields` jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_processing_usn` ON `processing_notes` (`usn`);--> statement-breakpoint
CREATE TABLE `review_logs` (
	`id` blob PRIMARY KEY NOT NULL,
	`card_id` blob NOT NULL,
	`usn` integer NOT NULL,
	`review_time` integer NOT NULL,
	`scheduled_days` integer NOT NULL,
	`rating` integer NOT NULL,
	`difficulty` real NOT NULL,
	`stability` real NOT NULL,
	`learning_steps` integer NOT NULL,
	`state` integer NOT NULL,
	`duration` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_review_logs_usn` ON `review_logs` (`usn`);--> statement-breakpoint
CREATE INDEX `ix_review_logs_card_id` ON `review_logs` (`card_id`);--> statement-breakpoint
CREATE TABLE `tombstones` (
	`unit_id` blob PRIMARY KEY NOT NULL,
	`usn` integer NOT NULL,
	`deleted_at` integer NOT NULL,
	`unit_type` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_tombstones_usn` ON `tombstones` (`usn`,`unit_type`,`unit_id`);