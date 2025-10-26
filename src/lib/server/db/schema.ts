import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table with roles
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['citizen', 'authority', 'admin'] }).notNull().default('citizen'),
	name: text('name').notNull(),
	phone: text('phone'),
	points: integer('points').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Sessions for Lucia auth
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// Issue categories
export const issueCategories = sqliteTable('issue_categories', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	department: text('department').notNull(),
	defaultEstimateHours: integer('default_estimate_hours').notNull().default(72),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Authorities and their assigned categories (many-to-many)
export const authorities = sqliteTable('authorities', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	categoryId: text('category_id').notNull().references(() => issueCategories.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Issues
export const issues = sqliteTable('issues', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	categoryId: text('category_id').notNull().references(() => issueCategories.id),
	locationLat: real('location_lat').notNull(),
	locationLng: real('location_lng').notNull(),
	locationAddress: text('location_address').notNull(),
	status: text('status', { enum: ['pending', 'in_progress', 'resolved', 'fake'] }).notNull().default('pending'),
	postedByUserId: text('posted_by_user_id').notNull().references(() => user.id),
	assignedToAuthorityId: text('assigned_to_authority_id').references(() => user.id),
	estimatedResolutionDate: integer('estimated_resolution_date', { mode: 'timestamp' }),
	actualResolutionDate: integer('actual_resolution_date', { mode: 'timestamp' }),
	photos: text('photos', { mode: 'json' }).$type<string[]>().default([]),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	deletedAt: integer('deleted_at', { mode: 'timestamp' })
});

// Issue updates/audit trail
export const issueUpdates = sqliteTable('issue_updates', {
	id: text('id').primaryKey(),
	issueId: text('issue_id').notNull().references(() => issues.id),
	authorityId: text('authority_id').notNull().references(() => user.id),
	comment: text('comment'),
	statusChange: text('status_change'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Issue followers (many-to-many)
export const issueFollowers = sqliteTable('issue_followers', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	issueId: text('issue_id').notNull().references(() => issues.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Notifications
export const notifications = sqliteTable('notifications', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	issueId: text('issue_id').references(() => issues.id),
	message: text('message').notNull(),
	read: integer('read', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Badges
export const badges = sqliteTable('badges', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	pointsRequired: integer('points_required').notNull(),
	icon: text('icon').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// User badges (many-to-many)
export const userBadges = sqliteTable('user_badges', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	badgeId: text('badge_id').notNull().references(() => badges.id),
	earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	postedIssues: many(issues, { relationName: 'postedBy' }),
	assignedIssues: many(issues, { relationName: 'assignedTo' }),
	issueUpdates: many(issueUpdates),
	issueFollowers: many(issueFollowers),
	notifications: many(notifications),
	userBadges: many(userBadges)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const issueCategoryRelations = relations(issueCategories, ({ many }) => ({
	issues: many(issues),
	authorities: many(authorities)
}));

export const authorityRelations = relations(authorities, ({ one }) => ({
	user: one(user, {
		fields: [authorities.userId],
		references: [user.id]
	}),
	category: one(issueCategories, {
		fields: [authorities.categoryId],
		references: [issueCategories.id]
	})
}));

export const issueRelations = relations(issues, ({ one, many }) => ({
	category: one(issueCategories, {
		fields: [issues.categoryId],
		references: [issueCategories.id]
	}),
	postedBy: one(user, {
		fields: [issues.postedByUserId],
		references: [user.id],
		relationName: 'postedBy'
	}),
	assignedTo: one(user, {
		fields: [issues.assignedToAuthorityId],
		references: [user.id],
		relationName: 'assignedTo'
	}),
	updates: many(issueUpdates),
	followers: many(issueFollowers)
}));

export const issueUpdateRelations = relations(issueUpdates, ({ one }) => ({
	issue: one(issues, {
		fields: [issueUpdates.issueId],
		references: [issues.id]
	}),
	authority: one(user, {
		fields: [issueUpdates.authorityId],
		references: [user.id]
	})
}));

export const issueFollowerRelations = relations(issueFollowers, ({ one }) => ({
	user: one(user, {
		fields: [issueFollowers.userId],
		references: [user.id]
	}),
	issue: one(issues, {
		fields: [issueFollowers.issueId],
		references: [issues.id]
	})
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id]
	}),
	issue: one(issues, {
		fields: [notifications.issueId],
		references: [issues.id]
	})
}));

export const badgeRelations = relations(badges, ({ many }) => ({
	userBadges: many(userBadges)
}));

export const userBadgeRelations = relations(userBadges, ({ one }) => ({
	user: one(user, {
		fields: [userBadges.userId],
		references: [user.id]
	}),
	badge: one(badges, {
		fields: [userBadges.badgeId],
		references: [badges.id]
	})
}));

// Type exports
export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type IssueCategory = typeof issueCategories.$inferSelect;
export type Authority = typeof authorities.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type IssueUpdate = typeof issueUpdates.$inferSelect;
export type IssueFollower = typeof issueFollowers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
