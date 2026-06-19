-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`userId` varchar(36) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_provider_providerAccountId_key` UNIQUE(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`job_id` varchar(36) NOT NULL,
	`freelancer_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`delivery_days` int,
	`cover_letter` text,
	`status` enum('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `bids_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_id` UNIQUE(`job_id`,`freelancer_id`)
);
--> statement-breakpoint
CREATE TABLE `blogs` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`author_id` varchar(36),
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text,
	`cover_url` text,
	`content` text NOT NULL,
	`published` tinyint(1) DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `blogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`icon` varchar(100),
	`description` text,
	`parent_id` varchar(36),
	`job_count` int DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `name` UNIQUE(`name`),
	CONSTRAINT `slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_a` varchar(36) NOT NULL,
	`user_b` varchar(36) NOT NULL,
	`job_id` varchar(36),
	`last_message_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_a` UNIQUE(`user_a`,`user_b`)
);
--> statement-breakpoint
CREATE TABLE `deposits` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` varchar(100) NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`reference` varchar(255),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `deposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `freelancer_skills` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	`level` varchar(191) NOT NULL,
	CONSTRAINT `freelancer_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `freelancer_work_experiences` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`title` varchar(191) NOT NULL,
	`type` varchar(191),
	`company` varchar(191) NOT NULL,
	`current` tinyint(1) NOT NULL DEFAULT 0,
	`startDate` varchar(191) NOT NULL,
	`endDate` varchar(191),
	`desc` text,
	`skills` varchar(191),
	`industry` varchar(191),
	CONSTRAINT `freelancer_work_experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`buyer_id` varchar(36) NOT NULL,
	`category_id` varchar(36),
	`title` varchar(255) NOT NULL,
	`slug` varchar(255),
	`description` text NOT NULL,
	`budget_min` decimal(12,2),
	`budget_max` decimal(12,2),
	`is_fixed` tinyint(1) DEFAULT 1,
	`duration` varchar(100),
	`skills` json,
	`attachments` json,
	`status` enum('open','in_progress','completed','cancelled','closed') NOT NULL DEFAULT 'open',
	`bid_count` int DEFAULT 0,
	`views` int DEFAULT 0,
	`deadline` date,
	`featured` tinyint(1) DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`conversation_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`link` text,
	`read` tinyint(1) DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` varchar(36) NOT NULL,
	`username` varchar(255),
	`display_name` varchar(255),
	`avatar_url` text,
	`cover_url` text,
	`bio` text,
	`headline` varchar(255),
	`country` varchar(100),
	`city` varchar(100),
	`phone` varchar(50),
	`hourly_rate` decimal(10,2),
	`skills` json,
	`languages` json,
	`email_verified` tinyint(1) DEFAULT 0,
	`phone_verified` tinyint(1) DEFAULT 0,
	`kyc_status` enum('unverified','pending','approved','rejected') DEFAULT 'unverified',
	`profile_completion` int DEFAULT 0,
	`rating` decimal(3,2) DEFAULT '0.00',
	`total_reviews` int DEFAULT 0,
	`jobs_completed` int DEFAULT 0,
	`success_score` int DEFAULT 0,
	`badge` varchar(100),
	`balance` decimal(12,2) DEFAULT '0.00',
	`pending_balance` decimal(12,2) DEFAULT '0.00',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `username` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`job_id` varchar(36) NOT NULL,
	`bid_id` varchar(36),
	`buyer_id` varchar(36) NOT NULL,
	`freelancer_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`status` enum('active','submitted','completed','cancelled','disputed') NOT NULL DEFAULT 'active',
	`started_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`completed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`project_id` varchar(36) NOT NULL,
	`reviewer_id` varchar(36) NOT NULL,
	`reviewee_id` varchar(36) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_id` UNIQUE(`project_id`,`reviewer_id`),
	CONSTRAINT `reviews_chk_1` CHECK((`rating` between 1 and 5))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`expires` datetime NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessionToken` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`priority` varchar(50) DEFAULT 'medium',
	`status` enum('open','answered','closed') NOT NULL DEFAULT 'open',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`ticket_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`is_admin` tinyint(1) DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('deposit','withdrawal','escrow','release','fee','refund') NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'completed',
	`description` text,
	`reference` varchar(255),
	`related_project_id` varchar(36),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`role` enum('admin','freelancer','buyer') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_id` UNIQUE(`user_id`,`role`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`name` varchar(255),
	`emailVerified` datetime,
	`image` varchar(255),
	`aboutText` text,
	`avatarUrl` varchar(191),
	`displayName` varchar(191),
	`language` varchar(191),
	`location` varchar(191),
	`password` varchar(191),
	`title` varchar(191),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`expires` datetime NOT NULL,
	`token` varchar(255) NOT NULL,
	CONSTRAINT `verification_tokens_identifier_token` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE TABLE `withdrawal_methods` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` varchar(255) NOT NULL,
	`currency` varchar(10) DEFAULT 'USD',
	`min_amount` decimal(12,2) DEFAULT '10.00',
	`max_amount` decimal(12,2) DEFAULT '10000.00',
	`fee_percent` decimal(5,2) DEFAULT '0.00',
	`fee_fixed` decimal(12,2) DEFAULT '0.00',
	`active` tinyint(1) DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `withdrawal_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`method_id` varchar(36),
	`amount` decimal(12,2) NOT NULL,
	`fee` decimal(12,2) DEFAULT '0.00',
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`account_details` json,
	`admin_note` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`processed_at` datetime,
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bids` ADD CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bids` ADD CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`freelancer_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogs` ADD CONSTRAINT `blogs_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_a`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user_b`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deposits` ADD CONSTRAINT `deposits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `freelancer_skills` ADD CONSTRAINT `free_skill_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `freelancer_work_experiences` ADD CONSTRAINT `free_work_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_ibfk_4` FOREIGN KEY (`freelancer_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`related_project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_ibfk_2` FOREIGN KEY (`method_id`) REFERENCES `withdrawal_methods`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userId` ON `accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_bids_job` ON `bids` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_bids_freelancer` ON `bids` (`freelancer_id`);--> statement-breakpoint
CREATE INDEX `author_id` ON `blogs` (`author_id`);--> statement-breakpoint
CREATE INDEX `parent_id` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `user_b` ON `conversations` (`user_b`);--> statement-breakpoint
CREATE INDEX `job_id` ON `conversations` (`job_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `deposits` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_free_skill_user` ON `freelancer_skills` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_free_work_user` ON `freelancer_work_experiences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_category` ON `jobs` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_buyer` ON `jobs` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `conversation_id` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `sender_id` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `job_id` ON `projects` (`job_id`);--> statement-breakpoint
CREATE INDEX `bid_id` ON `projects` (`bid_id`);--> statement-breakpoint
CREATE INDEX `buyer_id` ON `projects` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `freelancer_id` ON `projects` (`freelancer_id`);--> statement-breakpoint
CREATE INDEX `reviewer_id` ON `reviews` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `reviewee_id` ON `reviews` (`reviewee_id`);--> statement-breakpoint
CREATE INDEX `userId` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `user_id` ON `support_tickets` (`user_id`);--> statement-breakpoint
CREATE INDEX `ticket_id` ON `ticket_messages` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `sender_id` ON `ticket_messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `related_project_id` ON `transactions` (`related_project_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `withdrawals` (`user_id`);--> statement-breakpoint
CREATE INDEX `method_id` ON `withdrawals` (`method_id`);
*/