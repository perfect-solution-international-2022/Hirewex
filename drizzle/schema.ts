import {timestamp, mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, primaryKey, unique, varchar, text, int, decimal,tinyint, mysqlEnum, datetime, json, date, check } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"


export const accounts = mysqlTable("accounts", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar({ length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar({ length: 255 }).notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: int("expires_at"),
	tokenType: varchar("token_type", { length: 255 }),
	scope: varchar({ length: 255 }),
	idToken: text("id_token"),
	sessionState: varchar("session_state", { length: 255 }),
},
(table) => [
	index("userId").on(table.userId),
	primaryKey({ columns: [table.id], name: "accounts_id"}),
	unique("accounts_provider_providerAccountId_key").on(table.provider, table.providerAccountId),
]);

export const freelancerServices = mysqlTable("freelancer_services", {
	id: varchar("id", { length: 255 }).primaryKey(),
	freelancerId: varchar("freelancerId", { length: 255 }).notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description").notNull(),
	images: json("images"),
	category: varchar("category", { length: 255 }).notNull(),
	packages: json("packages").notNull(), 
	createdAt: timestamp("createdAt").defaultNow(),
	status: mysqlEnum("status", ["pending", "approved", "paused", "denied","requires_modification"]).default("pending"),
	adminNote: text("admin_note"),
	});

export const bids = mysqlTable("bids", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	jobId: varchar("job_id", { length: 36 }).notNull().references(() => jobs.id, { onDelete: "cascade" } ),
	freelancerId: varchar("freelancer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	deliveryDays: int("delivery_days"),
	coverLetter: text("cover_letter"),
	portfolioUrl: text("portfolio_url"),
	rejectedAt: datetime("rejected_at", { mode: 'string' }),
	status: mysqlEnum(['pending','accepted','rejected','withdrawn']).default('pending').notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("idx_bids_job").on(table.jobId),
	index("idx_bids_freelancer").on(table.freelancerId),
	primaryKey({ columns: [table.id], name: "bids_id"}),
	unique("job_id").on(table.jobId, table.freelancerId),
]);

export const blogs = mysqlTable("blogs", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	authorId: varchar("author_id", { length: 36 }).references(() => users.id, { onDelete: "set null" } ),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	excerpt: text(),
	coverUrl: text("cover_url"),
	content: text().notNull(),
	published: tinyint().default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("author_id").on(table.authorId),
	primaryKey({ columns: [table.id], name: "blogs_id"}),
	unique("slug").on(table.slug),
]);

export const categories = mysqlTable("categories", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 100 }),
	description: text(),
	parentId: varchar("parent_id", { length: 36 }),
	jobCount: int("job_count").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("parent_id").on(table.parentId),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_ibfk_1"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "categories_id"}),
	unique("name").on(table.name),
	unique("slug").on(table.slug),
]);

export const conversations = mysqlTable("conversations", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userA: varchar("user_a", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	userB: varchar("user_b", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	jobId: varchar("job_id", { length: 36 }).references(() => jobs.id, { onDelete: "set null" } ),
	lastMessageAt: datetime("last_message_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("user_b").on(table.userB),
	index("job_id").on(table.jobId),
	primaryKey({ columns: [table.id], name: "conversations_id"}),
	unique("user_a").on(table.userA, table.userB),
]);

export const deposits = mysqlTable("deposits", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	method: varchar({ length: 100 }).notNull(),
	status: mysqlEnum(['pending','completed','failed','cancelled']).default('pending').notNull(),
	reference: varchar({ length: 255 }),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("user_id").on(table.userId),
	primaryKey({ columns: [table.id], name: "deposits_id"}),
]);

export const freelancerSkills = mysqlTable("freelancer_skills", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	name: varchar({ length: 191 }).notNull(),
	level: varchar({ length: 191 }).notNull(),
},
(table) => [
	index("idx_free_skill_user").on(table.userId),
	primaryKey({ columns: [table.id], name: "freelancer_skills_id"}),
]);

export const freelancerWorkExperiences = mysqlTable("freelancer_work_experiences", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: varchar({ length: 191 }).notNull(),
	type: varchar({ length: 191 }),
	company: varchar({ length: 191 }).notNull(),
	current: tinyint().default(0).notNull(),
	startDate: varchar({ length: 191 }).notNull(),
	endDate: varchar({ length: 191 }),
	desc: text(),
	skills: varchar({ length: 191 }),
	industry: varchar({ length: 191 }),
},
(table) => [
	index("idx_free_work_user").on(table.userId),
	primaryKey({ columns: [table.id], name: "freelancer_work_experiences_id"}),
]);

export const jobs = mysqlTable("jobs", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	buyerId: varchar("buyer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	categoryId: varchar("category_id", { length: 36 }).references(() => categories.id, { onDelete: "set null" } ),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	description: text().notNull(),
	budgetMin: decimal("budget_min", { precision: 12, scale: 2 }),
	budgetMax: decimal("budget_max", { precision: 12, scale: 2 }),
	isFixed: tinyint("is_fixed").default(1),
	duration: varchar({ length: 100 }),
	skills: json(),
	attachments: json(),
	status: mysqlEnum(['open','in_progress','completed','cancelled','closed']).default('open').notNull(),
	bidCount: int("bid_count").default(0),
	views: int().default(0),
	skillLevel: varchar("skill_level", { length: 50 }),
  	projectScope: varchar("project_scope", { length: 50 }),
	deadline: date({ mode: 'string' }),
	featured: tinyint().default(0),
	approvalStatus: mysqlEnum("approval_status", ["pending", "approved", "denied", "requires_modification"]).default("pending"),
	adminNote: text("admin_note"),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("idx_jobs_status").on(table.status),
	index("idx_jobs_category").on(table.categoryId),
	index("idx_jobs_buyer").on(table.buyerId),
	primaryKey({ columns: [table.id], name: "jobs_id"}),
]);

export const messages = mysqlTable("messages", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	conversationId: varchar("conversation_id", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	body: text().notNull(),
	readAt: datetime("read_at", { mode: 'string'}),
	editedAt: datetime("edited_at", { mode: 'string'}),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("conversation_id").on(table.conversationId),
	index("sender_id").on(table.senderId),
	primaryKey({ columns: [table.id], name: "messages_id"}),
]);

export const notifications = mysqlTable("notifications", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	body: text(),
	link: text(),
	read: tinyint().default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("user_id").on(table.userId),
	primaryKey({ columns: [table.id], name: "notifications_id"}),
]);

export const profiles = mysqlTable("profiles", {
	id: varchar({ length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	username: varchar({ length: 255 }),
	displayName: varchar("display_name", { length: 255 }),
	avatarUrl: text("avatar_url"),
	coverUrl: text("cover_url"),
	bio: text(),
	headline: varchar({ length: 255 }),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	phone: varchar({ length: 50 }),
	hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
	skills: json(),
	languages: json(),
	emailVerified: tinyint("email_verified").default(0),
	phoneVerified: tinyint("phone_verified").default(0),
	kycStatus: mysqlEnum("kyc_status", ['unverified','pending','approved','rejected']).default('unverified'),
	profileCompletion: int("profile_completion").default(0),
	rating: decimal({ precision: 3, scale: 2 }).default('0.00'),
	totalReviews: int("total_reviews").default(0),
	jobsCompleted: int("jobs_completed").default(0),
	successScore: int("success_score").default(0),
	badge: varchar({ length: 100 }),
	balance: decimal({ precision: 12, scale: 2 }).default('0.00'),
	pendingBalance: decimal("pending_balance", { precision: 12, scale: 2 }).default('0.00'),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "profiles_id"}),
	unique("username").on(table.username),
]);

export const projects = mysqlTable("projects", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	jobId: varchar("job_id", { length: 36 }).notNull().references(() => jobs.id, { onDelete: "cascade" } ),
	bidId: varchar("bid_id", { length: 36 }).references(() => bids.id, { onDelete: "set null" } ),
	buyerId: varchar("buyer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	freelancerId: varchar("freelancer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	status: mysqlEnum(['active','submitted','completed','cancelled','disputed']).default('active').notNull(),
	startedAt: datetime("started_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	completedAt: datetime("completed_at", { mode: 'string'}),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("job_id").on(table.jobId),
	index("bid_id").on(table.bidId),
	index("buyer_id").on(table.buyerId),
	index("freelancer_id").on(table.freelancerId),
	primaryKey({ columns: [table.id], name: "projects_id"}),
]);

export const reviews = mysqlTable("reviews", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	projectId: varchar("project_id", { length: 36 }).references(() => projects.id, { onDelete: "cascade" }),
	serviceOrderId: varchar("service_order_id", { length: 36 }).references(() => serviceOrders.id, { onDelete: "cascade" }),
	reviewerId: varchar("reviewer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	revieweeId: varchar("reviewee_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	rating: int().notNull(),
	comment: text(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("reviewer_id").on(table.reviewerId),
	index("reviewee_id").on(table.revieweeId),
	primaryKey({ columns: [table.id], name: "reviews_id"}),
	unique("project_id").on(table.projectId, table.reviewerId),
	unique("review_order_reviewer").on(table.serviceOrderId, table.reviewerId),
	check("reviews_chk_1", sql`(\`rating\` between 1 and 5)`),
]);

export const sessions = mysqlTable("sessions", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	sessionToken: varchar({ length: 255 }).notNull(),
	userId: varchar({ length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	expires: datetime({ mode: 'string'}).notNull(),
},
(table) => [
	index("userId").on(table.userId),
	primaryKey({ columns: [table.id], name: "sessions_id"}),
	unique("sessionToken").on(table.sessionToken),
]);

export const supportTickets = mysqlTable("support_tickets", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	subject: varchar({ length: 255 }).notNull(),
	priority: varchar({ length: 50 }).default('medium'),
	status: mysqlEnum(['open','answered','closed']).default('open').notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("user_id").on(table.userId),
	primaryKey({ columns: [table.id], name: "support_tickets_id"}),
]);

export const ticketMessages = mysqlTable("ticket_messages", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	ticketId: varchar("ticket_id", { length: 36 }).notNull().references(() => supportTickets.id, { onDelete: "cascade" } ),
	senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	body: text().notNull(),
	isAdmin: tinyint("is_admin").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("ticket_id").on(table.ticketId),
	index("sender_id").on(table.senderId),
	primaryKey({ columns: [table.id], name: "ticket_messages_id"}),
]);

export const transactions = mysqlTable("transactions", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	type: mysqlEnum(['deposit','withdrawal','escrow','release','fee','refund']).notNull(),
	status: mysqlEnum(['pending','completed','failed','cancelled']).default('completed').notNull(),
	description: text(),
	reference: varchar({ length: 255 }),
	relatedProjectId: varchar("related_project_id", { length: 36 }).references(() => projects.id, { onDelete: "set null" } ),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("user_id").on(table.userId),
	index("related_project_id").on(table.relatedProjectId),
	primaryKey({ columns: [table.id], name: "transactions_id"}),
]);

export const userRoles = mysqlTable("user_roles", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	role: mysqlEnum(['admin','freelancer','buyer']).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_roles_id"}),
	unique("user_id").on(table.userId, table.role),
]);

export const users = mysqlTable("users", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	name: varchar({ length: 255 }),
	emailVerified: datetime({ mode: 'string'}),
	image: varchar({ length: 255 }),
	aboutText: text(),
	avatarUrl: varchar({ length: 191 }),
	displayName: varchar({ length: 191 }),
	language: varchar({ length: 191 }),
	location: varchar({ length: 191 }),
	password: varchar({ length: 191 }),
	title: varchar({ length: 191 }),
	portfolioUrl: text("portfolio_url"),
	kycStatus: mysqlEnum("kyc_status", ["unverified", "pending", "approved", "rejected"]).default("unverified"),
	bankName: varchar("bank_name", { length: 100 }),
	bankAccountHolder: varchar("bank_account_holder", { length: 255 }),
	bankAccountNumber: varchar("bank_account_number", { length: 50 }),
	bankBranch: varchar("bank_branch", { length: 100 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("email").on(table.email),
]);

export const verificationTokens = mysqlTable("verification_tokens", {
	identifier: varchar({ length: 255 }).notNull(),
	expires: datetime({ mode: 'string'}).notNull(),
	token: varchar({ length: 255 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token"}),
]);

export const withdrawalMethods = mysqlTable("withdrawal_methods", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	name: varchar({ length: 255 }).notNull(),
	currency: varchar({ length: 10 }).default('USD'),
	minAmount: decimal("min_amount", { precision: 12, scale: 2 }).default('10.00'),
	maxAmount: decimal("max_amount", { precision: 12, scale: 2 }).default('10000.00'),
	feePercent: decimal("fee_percent", { precision: 5, scale: 2 }).default('0.00'),
	feeFixed: decimal("fee_fixed", { precision: 12, scale: 2 }).default('0.00'),
	active: tinyint().default(1),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "withdrawal_methods_id"}),
]);

export const serviceOrders = mysqlTable("service_orders", {
  id: varchar({ length: 36 }).default(sql`(uuid())`).notNull().primaryKey(),
  buyerId: varchar("buyer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  freelancerId: varchar("freelancer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id", { length: 255 }).notNull().references(() => freelancerServices.id, { onDelete: "cascade" }),
  tier: varchar({ length: 50 }).notNull(),
  price: decimal({ precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  referenceId: varchar("reference_id", { length: 255 }), // The unique ID we send to OnePay
  createdAt: datetime("created_at", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const withdrawals = mysqlTable("withdrawals", {
	id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	methodId: varchar("method_id", { length: 36 }).references(() => withdrawalMethods.id, { onDelete: "set null" } ),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	fee: decimal({ precision: 12, scale: 2 }).default('0.00'),
	status: mysqlEnum(['pending','completed','failed','cancelled']).default('pending').notNull(),
	accountDetails: json("account_details"),
	adminNote: text("admin_note"),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	processedAt: datetime("processed_at", { mode: 'string'}),
},
(table) => [
	index("user_id").on(table.userId),
	index("method_id").on(table.methodId),
	primaryKey({ columns: [table.id], name: "withdrawals_id"}),
]);

export const projectSubmissions = mysqlTable("project_submissions", {
  id: varchar({ length: 36 }).default(sql`(uuid())`).notNull(),
  type: mysqlEnum("submission_type", ["project", "order"]).default("project").notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id, { onDelete: "cascade" }),
  serviceOrderId: varchar("service_order_id", { length: 36 }).references(() => serviceOrders.id, { onDelete: "cascade" }),
  freelancerId: varchar("freelancer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  fileUrl: text("file_url"),
  linkUrl: text("link_url"),
  status: mysqlEnum("ps_status", ["pending", "accepted", "rejected", "revision_requested"]).default("pending").notNull(),
  buyerNote: text("buyer_note"),
  paymentReleasedAt: datetime("payment_released_at", { mode: "string" }),
  releasedAmount: decimal("released_amount", { precision: 12, scale: 2 }),
  platformFeePercent: decimal("platform_fee_percent", { precision: 5, scale: 2 }),
  createdAt: datetime("created_at", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
  index("ps_project_id").on(table.projectId),
  index("ps_service_order_id").on(table.serviceOrderId),
  index("ps_freelancer_id").on(table.freelancerId),
  index("ps_buyer_id").on(table.buyerId),
  primaryKey({ columns: [table.id], name: "project_submissions_id" }),
]);

export const kycApplications = mysqlTable("kyc_applications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Basic Info
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  dob: timestamp("dob").notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  
  // Address
  country: varchar("country", { length: 100 }).notNull(),
  fullAddress: text("full_address").notNull(),
  
  // Documents (URLs from Vercel Blob)
  documentType: varchar("document_type", { length: 50 }).notNull(), // e.g., 'passport', 'id_card'
  documentNumber: varchar("document_number", { length: 100 }).notNull(),
  frontIdUrl: text("front_id_url").notNull(),
  backIdUrl: text("back_id_url"), // Optional for passports
  selfieUrl: text("selfie_url").notNull(),
  
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
});