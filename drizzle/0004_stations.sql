CREATE TABLE `stations` (
	`room_id` integer NOT NULL,
	`slot` integer NOT NULL,
	`equipment` text,
	`placed_at` integer,
	`last_used_at` integer,
	`user_id` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stations_pk` ON `stations` (`room_id`,`slot`);--> statement-breakpoint
CREATE UNIQUE INDEX `stations_one_each` ON `stations` (`room_id`,`user_id`) WHERE user_id is not null;