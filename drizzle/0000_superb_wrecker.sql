CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`subject_id` text NOT NULL,
	`details_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_subject_time_idx` ON `audit_events` (`subject_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `availability` (
	`room_type_id` text NOT NULL,
	`stay_date` text NOT NULL,
	`available_units` integer NOT NULL,
	`nightly_price_cents` integer NOT NULL,
	PRIMARY KEY(`room_type_id`, `stay_date`),
	FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `availability_date_idx` ON `availability` (`stay_date`,`room_type_id`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`confirmation_code` text NOT NULL,
	`user_id` text,
	`property_id` text NOT NULL,
	`room_type_id` text NOT NULL,
	`guest_name` text NOT NULL,
	`guest_email` text NOT NULL,
	`guest_phone` text NOT NULL,
	`check_in` text NOT NULL,
	`check_out` text NOT NULL,
	`guests` integer NOT NULL,
	`special_requests` text,
	`account_password_hash` text,
	`total_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`hold_expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_confirmation_code_unique` ON `bookings` (`confirmation_code`);--> statement-breakpoint
CREATE INDEX `bookings_room_dates_status_idx` ON `bookings` (`room_type_id`,`check_in`,`check_out`,`status`);--> statement-breakpoint
CREATE INDEX `bookings_guest_email_idx` ON `bookings` (`guest_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `bookings_user_created_idx` ON `bookings` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `email_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text NOT NULL,
	`provider_reference` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`provider_session_id` text,
	`provider_payment_id` text,
	`idempotency_key` text NOT NULL,
	`status` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_booking_id_unique` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_session_id_unique` ON `payments` (`provider_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_key_unique` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`region` text NOT NULL,
	`country` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`images_json` text NOT NULL,
	`amenities_json` text NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `properties_slug_unique` ON `properties` (`slug`);--> statement-breakpoint
CREATE INDEX `properties_city_published_idx` ON `properties` (`city`,`published`);--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`capacity` integer NOT NULL,
	`units` integer NOT NULL,
	`base_price_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`cancellation_policy` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `room_types_property_idx` ON `room_types` (`property_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'guest' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`processed_at` text NOT NULL
);
