PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`weight_kg` real,
	`reps` integer,
	`duration_s` integer,
	`distance_m` integer,
	`completed_at` integer NOT NULL,
	`rest_target_s` integer NOT NULL,
	`rest_ended_at` integer,
	`slack_s` integer,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sets`("id", "workout_id", "exercise_id", "weight_kg", "reps", "duration_s", "distance_m", "completed_at", "rest_target_s", "rest_ended_at", "slack_s") SELECT "id", "workout_id", "exercise_id", "weight_kg", "reps", "duration_s", "distance_m", "completed_at", "rest_target_s", "rest_ended_at", "slack_s" FROM `sets`;--> statement-breakpoint
DROP TABLE `sets`;--> statement-breakpoint
ALTER TABLE `__new_sets` RENAME TO `sets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `sets_workout` ON `sets` (`workout_id`);