import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { generateId } from 'lucia';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get all badges
	const badges = await db
		.select({
			id: table.badges.id,
			name: table.badges.name,
			description: table.badges.description,
			pointsRequired: table.badges.pointsRequired,
			icon: table.badges.icon,
			createdAt: table.badges.createdAt,
			userCount: count(table.userBadges.id)
		})
		.from(table.badges)
		.leftJoin(table.userBadges, eq(table.badges.id, table.userBadges.badgeId))
		.groupBy(table.badges.id)
		.orderBy(table.badges.pointsRequired);

	// Get system statistics
	const [userCount] = await db.select({ count: count() }).from(table.user);
	const [issueCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.deletedAt, null));
	const [resolvedCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.status, 'resolved'));
	const [fakeCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.status, 'fake'));

	// Get recent activity
	const recentIssues = await db
		.select({
			issue: table.issues,
			category: table.issueCategories,
			postedBy: {
				id: table.user.id,
				name: table.user.name
			}
		})
		.from(table.issues)
		.leftJoin(table.issueCategories, eq(table.issues.categoryId, table.issueCategories.id))
		.leftJoin(table.user, eq(table.issues.postedByUserId, table.user.id))
		.where(eq(table.issues.deletedAt, null))
		.orderBy(desc(table.issues.createdAt))
		.limit(5);

	return {
		badges,
		stats: {
			users: userCount.count,
			issues: issueCount.count,
			resolved: resolvedCount.count,
			fake: fakeCount.count,
			resolutionRate: issueCount.count > 0 ? Math.round((resolvedCount.count / issueCount.count) * 100) : 0
		},
		recentIssues
	};
};

export const actions: Actions = {
	createBadge: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const pointsRequired = parseInt(data.get('pointsRequired') as string);
		const icon = data.get('icon') as string;

		if (!name || !pointsRequired || !icon) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			const badgeId = generateId(15);

			await db.insert(table.badges).values({
				id: badgeId,
				name,
				description: description || null,
				pointsRequired,
				icon
			});

			return { success: true, message: 'Badge created successfully' };
		} catch (error) {
			console.error('Error creating badge:', error);
			return fail(500, { message: 'Failed to create badge' });
		}
	},

	updateBadge: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const badgeId = data.get('badgeId') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const pointsRequired = parseInt(data.get('pointsRequired') as string);
		const icon = data.get('icon') as string;

		if (!badgeId || !name || !pointsRequired || !icon) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await db
				.update(table.badges)
				.set({
					name,
					description: description || null,
					pointsRequired,
					icon
				})
				.where(eq(table.badges.id, badgeId));

			return { success: true, message: 'Badge updated successfully' };
		} catch (error) {
			console.error('Error updating badge:', error);
			return fail(500, { message: 'Failed to update badge' });
		}
	},

	deleteBadge: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const badgeId = data.get('badgeId') as string;

		if (!badgeId) {
			return fail(400, { message: 'Badge ID is required' });
		}

		try {
			await db.delete(table.badges).where(eq(table.badges.id, badgeId));
			return { success: true, message: 'Badge deleted successfully' };
		} catch (error) {
			console.error('Error deleting badge:', error);
			return fail(500, { message: 'Failed to delete badge' });
		}
	},

	resetUserPoints: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'User ID is required' });
		}

		try {
			await db
				.update(table.user)
				.set({ points: 0 })
				.where(eq(table.user.id, userId));

			// Remove all user badges
			await db.delete(table.userBadges).where(eq(table.userBadges.userId, userId));

			return { success: true, message: 'User points and badges reset successfully' };
		} catch (error) {
			console.error('Error resetting user points:', error);
			return fail(500, { message: 'Failed to reset user points' });
		}
	}
};
