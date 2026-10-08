ALTER TABLE `exercises` ADD `kind` text DEFAULT 'weight' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `default_rest_s` integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE `sets` ADD `duration_s` integer;--> statement-breakpoint
ALTER TABLE `sets` ADD `distance_m` integer;--> statement-breakpoint
ALTER TABLE `sets` ADD `rest_ended_at` integer;