import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'citizen') {
		if (locals.user.role === 'authority') {
			throw redirect(302, '/authority');
		} else if (locals.user.role === 'admin') {
			throw redirect(302, '/admin');
		}
	}

	// Fetch user's issues with category and assigned authority info
	const issues = await db
		.select({
			issue: table.issues,
			category: table.issueCategories,
			assignedAuthority: {
				id: table.user.id,
				name: table.user.name,
				email: table.user.email
			}
		})
		.from(table.issues)
		.leftJoin(table.issueCategories, eq(table.issues.categoryId, table.issueCategories.id))
		.leftJoin(table.user, eq(table.issues.assignedToAuthorityId, table.user.id))
		.where(
			and(
				eq(table.issues.postedByUserId, locals.user.id),
				isNull(table.issues.deletedAt)
			)
		)
		.orderBy(table.issues.createdAt);

	// Fetch categories for filtering
	const categories = await db.select().from(table.issueCategories);

	// Fetch user's following issues
	const followingIssues = await db
		.select({ issueId: table.issueFollowers.issueId })
		.from(table.issueFollowers)
		.where(eq(table.issueFollowers.userId, locals.user.id));

	return {
		user: locals.user,
		issues,
		categories,
		followingIssues
	};
};
