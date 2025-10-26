import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Fetch all issues with category and posted by user info
	const issuesWithPostedBy = await db
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
		.where(isNull(table.issues.deletedAt))
		.orderBy(desc(table.issues.createdAt));

	// Get assigned authorities for each issue
	const issues = await Promise.all(
		issuesWithPostedBy.map(async (item) => {
			let assignedTo = null;
			if (item.issue.assignedToAuthorityId) {
				const [assignedUser] = await db
					.select({
						id: table.user.id,
						name: table.user.name
					})
					.from(table.user)
					.where(eq(table.user.id, item.issue.assignedToAuthorityId));
				assignedTo = assignedUser;
			}
			
			return {
				...item,
				assignedTo
			};
		})
	);

	// Get top citizens by points
	const topCitizens = await db
		.select({
			id: table.user.id,
			name: table.user.name,
			points: table.user.points
		})
		.from(table.user)
		.where(eq(table.user.role, 'citizen'))
		.orderBy(desc(table.user.points))
		.limit(10);

	// Get issue statistics
	const totalIssues = issues.length;
	const resolvedIssues = issues.filter(i => i.issue.status === 'resolved').length;
	const pendingIssues = issues.filter(i => i.issue.status === 'pending').length;
	const inProgressIssues = issues.filter(i => i.issue.status === 'in_progress').length;

	return {
		issues,
		topCitizens,
		stats: {
			total: totalIssues,
			resolved: resolvedIssues,
			pending: pendingIssues,
			inProgress: inProgressIssues
		}
	};
};
