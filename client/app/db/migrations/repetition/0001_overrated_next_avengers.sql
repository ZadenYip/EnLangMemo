PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notes` (
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
INSERT INTO `__new_notes`("id", "note_type_id", "usn", "created_at", "updated_at", "sense_id", "sort_field", "search_fields", "fields") SELECT "id", "note_type_id", "usn", "created_at", "updated_at", "sense_id", "sort_field", "search_fields", "fields" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ix_notes_usn` ON `notes` (`usn`);--> statement-breakpoint
CREATE TABLE `__new_processing_notes` (
	`id` blob PRIMARY KEY NOT NULL,
	`note_type_id` blob NOT NULL,
	`usn` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sense_id` integer,
	`fields` jsonb NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_processing_notes`("id", "note_type_id", "usn", "created_at", "updated_at", "sense_id", "fields") SELECT "id", "note_type_id", "usn", "created_at", "updated_at", "sense_id", "fields" FROM `processing_notes`;--> statement-breakpoint
DROP TABLE `processing_notes`;--> statement-breakpoint
ALTER TABLE `__new_processing_notes` RENAME TO `processing_notes`;--> statement-breakpoint
CREATE INDEX `ix_processing_usn` ON `processing_notes` (`usn`);