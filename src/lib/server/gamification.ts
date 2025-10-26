import { db } from './db';
import * as table from './db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { generateId } from 'lucia';

export interface PointsAction {
	userId: string;
	action: 'post_issue' | 'issue_resolved' | 'issue_fake' | 'follow_issue';
	issueId?: string;
	points: number;
}

export async function awardPoints(action: PointsAction) {
	try {
		// Get current user points
		const [user] = await db
			.select({ points: table.user.points })
			.from(table.user)
			.where(eq(table.user.id, action.userId));

		if (!user) return;

		// Add points to existing total
		const newPoints = user.points + action.points;
		
		// Update user points
		await db
			.update(table.user)
			.set({ points: newPoints })
			.where(eq(table.user.id, action.userId));

		// Check for new badges
		await checkAndAwardBadges(action.userId);

		// Create notification
		await createNotification({
			userId: action.userId,
			message: `You earned ${action.points} points for ${action.action.replace('_', ' ')}!`,
			issueId: action.issueId
		});
	} catch (error) {
		console.error('Error awarding points:', error);
	}
}

export async function checkAndAwardBadges(userId: string) {
	try {
		// Get user's current points
		const [user] = await db
			.select({ points: table.user.points })
			.from(table.user)
			.where(eq(table.user.id, userId));

		if (!user) return;

		// Get all badges the user qualifies for (points required <= user's points)
		const availableBadges = await db
			.select()
			.from(table.badges)
			.where(lte(table.badges.pointsRequired, user.points));

		// Get user's current badges
		const userBadges = await db
			.select({ badgeId: table.userBadges.badgeId })
			.from(table.userBadges)
			.where(eq(table.userBadges.userId, userId));

		const userBadgeIds = userBadges.map(ub => ub.badgeId);

		// Award new badges
		for (const badge of availableBadges) {
			if (!userBadgeIds.includes(badge.id)) {
				await db.insert(table.userBadges).values({
					id: generateId(15),
					userId,
					badgeId: badge.id,
					earnedAt: new Date()
				});

				// Create notification for badge
				await createNotification({
					userId,
					message: `🎉 Congratulations! You earned the "${badge.name}" badge!`,
					issueId: undefined
				});
			}
		}
	} catch (error) {
		console.error('Error checking badges:', error);
	}
}

export async function createNotification(data: {
	userId: string;
	message: string;
	issueId?: string;
}) {
	try {
		await db.insert(table.notifications).values({
			id: generateId(15),
			userId: data.userId,
			issueId: data.issueId || null,
			message: data.message,
			read: false,
			createdAt: new Date()
		});
	} catch (error) {
		console.error('Error creating notification:', error);
	}
}

export async function getLeaderboard(limit: number = 10) {
	try {
		return await db
			.select({
				id: table.user.id,
				name: table.user.name,
				points: table.user.points,
				role: table.user.role
			})
			.from(table.user)
			.where(eq(table.user.role, 'citizen'))
			.orderBy(table.user.points)
			.limit(limit);
	} catch (error) {
		console.error('Error getting leaderboard:', error);
		return [];
	}
}

export async function getUserBadges(userId: string) {
	try {
		return await db
			.select({
				badge: table.badges,
				earnedAt: table.userBadges.earnedAt
			})
			.from(table.userBadges)
			.leftJoin(table.badges, eq(table.userBadges.badgeId, table.badges.id))
			.where(eq(table.userBadges.userId, userId))
			.orderBy(table.userBadges.earnedAt);
	} catch (error) {
		console.error('Error getting user badges:', error);
		return [];
	}
}
