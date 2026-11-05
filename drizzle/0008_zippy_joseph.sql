CREATE TABLE `exercise_notes` (
	`workout_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_notes_pk` ON `exercise_notes` (`workout_id`,`exercise_id`);--> statement-breakpoint
CREATE TABLE `plan_exercises` (
	`plan_id` integer NOT NULL,
	`position` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`sets` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_exercises_pk` ON `plan_exercises` (`plan_id`,`position`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `plans_user` ON `plans` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `sets` ADD `set_type` text;--> statement-breakpoint
ALTER TABLE `sets` ADD `rpe` real;--> statement-breakpoint
ALTER TABLE `workouts` ADD `plan_id` integer REFERENCES plans(id);--> statement-breakpoint
ALTER TABLE `workouts` ADD `saved_plan_id` integer REFERENCES plans(id);