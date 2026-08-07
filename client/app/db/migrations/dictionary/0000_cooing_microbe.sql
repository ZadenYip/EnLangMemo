CREATE TABLE `definitions` (
	`def_id` integer PRIMARY KEY NOT NULL,
	`word_pos_id` integer NOT NULL,
	`def_src` text,
	`def_tgt` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`word_pos_id`) REFERENCES `word_poses`(`pose_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_definitions_word_pos_id` ON `definitions` (`word_pos_id`);--> statement-breakpoint
CREATE TABLE `examples` (
	`exp_id` integer PRIMARY KEY NOT NULL,
	`def_id` integer NOT NULL,
	`ex_src` text NOT NULL,
	`ex_tgt` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`def_id`) REFERENCES `definitions`(`def_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_examples_def_id` ON `examples` (`def_id`);--> statement-breakpoint
CREATE TABLE `word_poses` (
	`pose_id` integer PRIMARY KEY NOT NULL,
	`word_id` integer NOT NULL,
	`part_of_speech` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`word_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_word_poses_word_id` ON `word_poses` (`word_id`);--> statement-breakpoint
CREATE TABLE `words` (
	`word_id` integer PRIMARY KEY NOT NULL,
	`spelling` text NOT NULL,
	`entry_version` integer NOT NULL,
	`phonetic_bre` text,
	`phonetic_ame` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_words_spelling` ON `words` (`spelling`);