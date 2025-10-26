import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, isNull, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'citizen') {
		// Redirect based on actual role
		if (locals.user.role === 'authority') {
			throw redirect(302, '/authority');
		} else if (locals.user.role === 'admin') {
			throw redirect(302, '/admin');
		}
	}

	// Get user's issue statistics
	const [issuesPosted] = await db
		.select({ count: count() })
		.from(table.issues)
		.where(
			and(
				eq(table.issues.postedByUserId, locals.user.id),
				isNull(table.issues.deletedAt)
			)
		);

	const [issuesResolved] = await db
		.select({ count: count() })
		.from(table.issues)
		.where(
			and(
				eq(table.issues.postedByUserId, locals.user.id),
				eq(table.issues.status, 'resolved'),
				isNull(table.issues.deletedAt)
			)
		);

	// Get user's badges
	const userBadges = await db
		.select({
			badge: table.badges,
			earnedAt: table.userBadges.earnedAt
		})
		.from(table.userBadges)
		.leftJoin(table.badges, eq(table.userBadges.badgeId, table.badges.id))
		.where(eq(table.userBadges.userId, locals.user.id))
		.orderBy(table.userBadges.earnedAt);

	// Get all available badges for the badges card
	const allBadges = await db
		.select()
		.from(table.badges)
		.orderBy(table.badges.pointsRequired);

	// Get user's notifications (last 20)
	const notifications = await db
		.select()
		.from(table.notifications)
		.where(eq(table.notifications.userId, locals.user.id))
		.orderBy(table.notifications.createdAt)
		.limit(20);

	// Get leaderboard (top 20 citizens by points)
	const leaderboard = await db
		.select({
			id: table.user.id,
			name: table.user.name,
			points: table.user.points
		})
		.from(table.user)
		.where(eq(table.user.role, 'citizen'))
		.orderBy(table.user.points)
		.limit(20);

	return {
		user: locals.user,
		stats: {
			issuesPosted: issuesPosted.count,
			issuesResolved: issuesResolved.count,
			points: locals.user.points
		},
		badges: userBadges,
		allBadges,
		notifications,
		leaderboard
	};
};
