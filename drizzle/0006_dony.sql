ALTER TABLE `rooms` ADD `dony_summoned_at` integer;--> statement-breakpoint
ALTER TABLE `rooms` ADD `dony_summoned_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `rooms` ADD `dony_sent_back_at` integer;