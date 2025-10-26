import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, isNull, count, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'admin') {
		if (locals.user.role === 'citizen') {
			throw redirect(302, '/citizen');
		} else if (locals.user.role === 'authority') {
			throw redirect(302, '/authority');
		}
	}

	// Get system statistics
	const [userCount] = await db.select({ count: count() }).from(table.user);
	const [issueCount] = await db.select({ count: count() }).from(table.issues).where(isNull(table.issues.deletedAt));
	const [categoryCount] = await db.select({ count: count() }).from(table.issueCategories);
	const [authorityCount] = await db.select({ count: count() }).from(table.authorities);
	
	// Get detailed statistics
	const [resolvedCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.status, 'resolved'));
	const [pendingCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.status, 'pending'));
	const [inProgressCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.status, 'in_progress'));
	const [fakeCount] = await db.select({ count: count() }).from(table.issues).where(eq(table.issues.status, 'fake'));
	
	// Get user role statistics
	const [citizenCount] = await db.select({ count: count() }).from(table.user).where(eq(table.user.role, 'citizen'));
	const [adminCount] = await db.select({ count: count() }).from(table.user).where(eq(table.user.role, 'admin'));
	const [authorityUserCount] = await db.select({ count: count() }).from(table.user).where(eq(table.user.role, 'authority'));
	
	// Get issues by category
	const issuesByCategory = await db
		.select({
			category: table.issueCategories,
			count: count(table.issues.id)
		})
		.from(table.issueCategories)
		.leftJoin(table.issues, eq(table.issueCategories.id, table.issues.categoryId))
		.where(isNull(table.issues.deletedAt))
		.groupBy(table.issueCategories.id)
		.orderBy(desc(count(table.issues.id)));
	
	// Get top contributors (users with most points)
	const topContributors = await db
		.select({
			id: table.user.id,
			name: table.user.name,
			points: table.user.points,
			issueCount: count(table.issues.id)
		})
		.from(table.user)
		.leftJoin(table.issues, eq(table.user.id, table.issues.postedByUserId))
		.where(eq(table.user.role, 'citizen'))
		.groupBy(table.user.id)
		.orderBy(desc(table.user.points))
		.limit(5);

	// Get recent issues
	const recentIssues = await db
		.select({
			issue: table.issues,
			category: table.issueCategories,
			postedBy: {
				id: table.user.id,
				name: table.user.name,
				email: table.user.email
			}
		})
		.from(table.issues)
		.leftJoin(table.issueCategories, eq(table.issues.categoryId, table.issueCategories.id))
		.leftJoin(table.user, eq(table.issues.postedByUserId, table.user.id))
		.where(isNull(table.issues.deletedAt))
		.orderBy(table.issues.createdAt)
		.limit(10);

	return {
		user: locals.user,
		stats: {
			users: userCount.count,
			issues: issueCount.count,
			categories: categoryCount.count,
			authorities: authorityCount.count,
			resolved: resolvedCount.count,
			pending: pendingCount.count,
			inProgress: inProgressCount.count,
			fake: fakeCount.count,
			citizens: citizenCount.count,
			admins: adminCount.count,
			authorityUsers: authorityUserCount.count,
			resolutionRate: issueCount.count > 0 ? Math.round((resolvedCount.count / issueCount.count) * 100) : 0
		},
		issuesByCategory,
		topContributors,
		recentIssues
	};
};
