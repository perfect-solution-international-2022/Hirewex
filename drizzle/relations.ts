import { relations } from "drizzle-orm/relations";
import { users, accounts, jobs, bids, blogs, categories, conversations, deposits, freelancerSkills, freelancerWorkExperiences, messages, notifications, profiles, projects, reviews, sessions, supportTickets, ticketMessages, transactions, userRoles, withdrawals, withdrawalMethods } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	bids: many(bids),
	blogs: many(blogs),
	conversations_userA: many(conversations, {
		relationName: "conversations_userA_users_id"
	}),
	conversations_userB: many(conversations, {
		relationName: "conversations_userB_users_id"
	}),
	deposits: many(deposits),
	freelancerSkills: many(freelancerSkills),
	freelancerWorkExperiences: many(freelancerWorkExperiences),
	jobs: many(jobs),
	messages: many(messages),
	notifications: many(notifications),
	profiles: many(profiles),
	projects_buyerId: many(projects, {
		relationName: "projects_buyerId_users_id"
	}),
	projects_freelancerId: many(projects, {
		relationName: "projects_freelancerId_users_id"
	}),
	reviews_reviewerId: many(reviews, {
		relationName: "reviews_reviewerId_users_id"
	}),
	reviews_revieweeId: many(reviews, {
		relationName: "reviews_revieweeId_users_id"
	}),
	sessions: many(sessions),
	supportTickets: many(supportTickets),
	ticketMessages: many(ticketMessages),
	transactions: many(transactions),
	userRoles: many(userRoles),
	withdrawals: many(withdrawals),
}));

export const bidsRelations = relations(bids, ({one, many}) => ({
	job: one(jobs, {
		fields: [bids.jobId],
		references: [jobs.id]
	}),
	user: one(users, {
		fields: [bids.freelancerId],
		references: [users.id]
	}),
	projects: many(projects),
}));

export const jobsRelations = relations(jobs, ({one, many}) => ({
	bids: many(bids),
	conversations: many(conversations),
	user: one(users, {
		fields: [jobs.buyerId],
		references: [users.id]
	}),
	category: one(categories, {
		fields: [jobs.categoryId],
		references: [categories.id]
	}),
	projects: many(projects),
}));

export const blogsRelations = relations(blogs, ({one}) => ({
	user: one(users, {
		fields: [blogs.authorId],
		references: [users.id]
	}),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	jobs: many(jobs),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user_userA: one(users, {
		fields: [conversations.userA],
		references: [users.id],
		relationName: "conversations_userA_users_id"
	}),
	user_userB: one(users, {
		fields: [conversations.userB],
		references: [users.id],
		relationName: "conversations_userB_users_id"
	}),
	job: one(jobs, {
		fields: [conversations.jobId],
		references: [jobs.id]
	}),
	messages: many(messages),
}));

export const depositsRelations = relations(deposits, ({one}) => ({
	user: one(users, {
		fields: [deposits.userId],
		references: [users.id]
	}),
}));

export const freelancerSkillsRelations = relations(freelancerSkills, ({one}) => ({
	user: one(users, {
		fields: [freelancerSkills.userId],
		references: [users.id]
	}),
}));

export const freelancerWorkExperiencesRelations = relations(freelancerWorkExperiences, ({one}) => ({
	user: one(users, {
		fields: [freelancerWorkExperiences.userId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	user: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one}) => ({
	user: one(users, {
		fields: [profiles.id],
		references: [users.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	job: one(jobs, {
		fields: [projects.jobId],
		references: [jobs.id]
	}),
	bid: one(bids, {
		fields: [projects.bidId],
		references: [bids.id]
	}),
	user_buyerId: one(users, {
		fields: [projects.buyerId],
		references: [users.id],
		relationName: "projects_buyerId_users_id"
	}),
	user_freelancerId: one(users, {
		fields: [projects.freelancerId],
		references: [users.id],
		relationName: "projects_freelancerId_users_id"
	}),
	reviews: many(reviews),
	transactions: many(transactions),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	project: one(projects, {
		fields: [reviews.projectId],
		references: [projects.id]
	}),
	user_reviewerId: one(users, {
		fields: [reviews.reviewerId],
		references: [users.id],
		relationName: "reviews_reviewerId_users_id"
	}),
	user_revieweeId: one(users, {
		fields: [reviews.revieweeId],
		references: [users.id],
		relationName: "reviews_revieweeId_users_id"
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({one, many}) => ({
	user: one(users, {
		fields: [supportTickets.userId],
		references: [users.id]
	}),
	ticketMessages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({one}) => ({
	supportTicket: one(supportTickets, {
		fields: [ticketMessages.ticketId],
		references: [supportTickets.id]
	}),
	user: one(users, {
		fields: [ticketMessages.senderId],
		references: [users.id]
	}),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [transactions.relatedProjectId],
		references: [projects.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
}));

export const withdrawalsRelations = relations(withdrawals, ({one}) => ({
	user: one(users, {
		fields: [withdrawals.userId],
		references: [users.id]
	}),
	withdrawalMethod: one(withdrawalMethods, {
		fields: [withdrawals.methodId],
		references: [withdrawalMethods.id]
	}),
}));

export const withdrawalMethodsRelations = relations(withdrawalMethods, ({many}) => ({
	withdrawals: many(withdrawals),
}));