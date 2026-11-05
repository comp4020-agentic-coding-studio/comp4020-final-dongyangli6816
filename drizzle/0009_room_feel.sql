CREATE TABLE `personal_bests` (
	`set_id` integer PRIMARY KEY NOT NULL,
	`room_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `personal_bests_room` ON `personal_bests` (`room_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `interactions` ADD `answers_id` integer;--> statement-breakpoint
ALTER TABLE `interactions` ADD `done_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `interactions_one_reply` ON `interactions` (`answers_id`) WHERE answers_id is not null;