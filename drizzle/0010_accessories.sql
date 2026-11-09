CREATE TABLE `user_unlocks` (
	`user_id` integer NOT NULL,
	`acc` text NOT NULL,
	`earned_at` integer NOT NULL,
	`workout_id` integer,
	`room_id` integer,
	`quiet` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`user_id`, `acc`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_unlocks_workout` ON `user_unlocks` (`workout_id`);--> statement-breakpoint
CREATE INDEX `user_unlocks_room` ON `user_unlocks` (`room_id`,`earned_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `wear` text;--> statement-breakpoint
ALTER TABLE `users` ADD `unlocks_checked_at` integer;