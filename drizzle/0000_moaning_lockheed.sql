CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`equipment` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`room_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`joined_at` integer NOT NULL,
	`left_at` integer,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_members_pk` ON `room_members` (`room_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`passcode` text NOT NULL,
	`host_user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`host_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_open_passcode` ON `rooms` (`passcode`) WHERE closed_at is null;--> statement-breakpoint
CREATE TABLE `sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`reps` integer NOT NULL,
	`completed_at` integer NOT NULL,
	`rest_target_s` integer NOT NULL,
	`slack_s` integer,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sets_workout` ON `sets` (`workout_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`room_id` integer,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workouts_user` ON `workouts` (`user_id`,`started_at`);