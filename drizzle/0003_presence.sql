CREATE TABLE `presence` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`room_id` integer NOT NULL,
	`state` text NOT NULL,
	`exercise_id` integer,
	`state_started_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
