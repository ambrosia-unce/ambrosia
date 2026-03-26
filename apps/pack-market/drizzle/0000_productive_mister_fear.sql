CREATE TABLE `packs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`description` text NOT NULL,
	`author` text NOT NULL,
	`category` text NOT NULL,
	`tags` text NOT NULL,
	`files` text NOT NULL,
	`dependencies` text NOT NULL,
	`dev_dependencies` text NOT NULL,
	`registry_deps` text NOT NULL,
	`ambrosia_deps` text NOT NULL,
	`published_by` text NOT NULL,
	`github_id_publisher` integer NOT NULL,
	`repo_url` text DEFAULT '' NOT NULL,
	`downloads` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`readme` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `packs_name_unique` ON `packs` (`name`);--> statement-breakpoint
CREATE TABLE `user_packs` (
	`user_id` integer NOT NULL,
	`pack_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `pack_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pack_id`) REFERENCES `packs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`username` text NOT NULL,
	`avatar_url` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);