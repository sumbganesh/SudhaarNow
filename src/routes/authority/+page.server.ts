import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'authority') {
		if (locals.user.role === 'citizen') {
			throw redirect(302, '/citizen');
		} else if (locals.user.role === 'admin') {
			throw redirect(302, '/admin');
		}
	}

	// Get assigned categories for this authority
	const authorityCategories = await db
		.select({ categoryId: table.authorities.categoryId })
		.from(table.authorities)
		.where(eq(table.authorities.userId, locals.user.id));

	const categoryIds = authorityCategories.map(ac => ac.categoryId);

	// Fetch assigned issues
	const issues = await db
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
		.where(
			and(
				inArray(table.issues.categoryId, categoryIds),
				isNull(table.issues.deletedAt)
			)
		)
		.orderBy(table.issues.createdAt);

	// Calculate metrics
	const totalIssues = issues.length;
	const resolvedIssues = issues.filter(i => i.issue.status === 'resolved').length;
	const pendingIssues = issues.filter(i => i.issue.status === 'pending').length;
	const inProgressIssues = issues.filter(i => i.issue.status === 'in_progress').length;
	const fakeIssues = issues.filter(i => i.issue.status === 'fake').length;

	// Calculate average resolution time for resolved issues
	const resolvedIssuesWithDates = issues.filter(i => 
		i.issue.status === 'resolved' && i.issue.actualResolutionDate
	);
	const averageResolutionTime = resolvedIssuesWithDates.length > 0 
		? resolvedIssuesWithDates.reduce((sum, i) => {
			const resolutionTime = new Date(i.issue.actualResolutionDate!).getTime() - new Date(i.issue.createdAt).getTime();
			return sum + (resolutionTime / (1000 * 60 * 60)); // Convert to hours
		}, 0) / resolvedIssuesWithDates.length
		: 0;

	// Calculate average response time (time to first status change)
	const issuesWithUpdates = await db
		.select({
			issueId: table.issueUpdates.issueId,
			firstUpdate: table.issueUpdates.createdAt
		})
		.from(table.issueUpdates)
		.where(inArray(table.issueUpdates.issueId, issues.map(i => i.issue.id)));

	const responseTime = issuesWithUpdates.length > 0
		? issuesWithUpdates.reduce((sum, update) => {
			const issue = issues.find(i => i.issue.id === update.issueId);
			if (issue) {
				const responseTime = new Date(update.firstUpdate).getTime() - new Date(issue.issue.createdAt).getTime();
				return sum + (responseTime / (1000 * 60 * 60)); // Convert to hours
			}
			return sum;
		}, 0) / issuesWithUpdates.length
		: 0;

	// Get category breakdown
	const categoryBreakdown = await db
		.select({
			categoryId: table.issueCategories.id,
			categoryName: table.issueCategories.name,
			department: table.issueCategories.department
		})
		.from(table.issueCategories)
		.where(inArray(table.issueCategories.id, categoryIds));

	const assignedCategories = categoryBreakdown.map(cat => {
		const issueCount = issues.filter(i => i.category?.id === cat.categoryId).length;
		return {
			name: cat.categoryName,
			department: cat.department,
			issueCount
		};
	});

	const metrics = {
		totalIssues,
		resolvedIssues,
		pendingIssues,
		inProgressIssues,
		fakeIssues,
		averageResolutionTime,
		responseTime,
		assignedCategories
	};

	return {
		user: locals.user,
		issues,
		assignedCategories: categoryIds,
		metrics
	};
};
