import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateId } from 'lucia';

export const load: PageServerLoad = async ({ locals, params }) => {
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

	// Get the issue with all related data
	const [issueData] = await db
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
				eq(table.issues.id, params.id),
				isNull(table.issues.deletedAt)
			)
		);

	if (!issueData) {
		throw redirect(302, '/authority');
	}

	// Get issue updates/audit trail
	const updates = await db
		.select({
			update: table.issueUpdates,
			authority: {
				id: table.user.id,
				name: table.user.name
			}
		})
		.from(table.issueUpdates)
		.leftJoin(table.user, eq(table.issueUpdates.authorityId, table.user.id))
		.where(eq(table.issueUpdates.issueId, params.id))
		.orderBy(table.issueUpdates.createdAt);

	return {
		user: locals.user,
		issue: issueData.issue,
		category: issueData.category,
		postedBy: issueData.postedBy,
		updates
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'authority') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const status = formData.get('status') as string;
		const comment = formData.get('comment') as string;
		const estimatedDate = formData.get('estimatedDate') as string;

		if (!status) {
			return fail(400, { message: 'Status is required' });
		}

		try {
			// Update the issue
			const updateData: any = {
				status,
				updatedAt: new Date()
			};

			if (estimatedDate) {
				updateData.estimatedResolutionDate = new Date(estimatedDate);
			}

			if (status === 'resolved') {
				updateData.actualResolutionDate = new Date();
			}

			await db
				.update(table.issues)
				.set(updateData)
				.where(eq(table.issues.id, params.id));

			// Create audit trail entry
			const updateId = generateId(15);
			await db.insert(table.issueUpdates).values({
				id: updateId,
				issueId: params.id,
				authorityId: locals.user.id,
				comment: comment || null,
				statusChange: status,
				createdAt: new Date()
			});

			// Award points and create notifications based on status change
			const { awardPoints, createNotification } = await import('$lib/server/gamification');
			
			// Get the issue to find the original poster
			const [issue] = await db
				.select({ 
					postedByUserId: table.issues.postedByUserId,
					title: table.issues.title
				})
				.from(table.issues)
				.where(eq(table.issues.id, params.id));

			if (issue) {
				if (status === 'resolved') {
					// Award points to the original poster
					await awardPoints({
						userId: issue.postedByUserId,
						action: 'issue_resolved',
						issueId: params.id,
						points: 20
					});
				} else if (status === 'fake') {
					// Deduct points for fake issue
					await awardPoints({
						userId: issue.postedByUserId,
						action: 'issue_fake',
						issueId: params.id,
						points: -15
					});
				}

				// Create notification for the original poster
				const statusText = status === 'pending' ? 'Pending' :
					status === 'in_progress' ? 'In Progress' :
					status === 'resolved' ? 'Resolved' :
					status === 'fake' ? 'Marked as Fake' :
					status;
				
				await createNotification({
					userId: issue.postedByUserId,
					message: `Your issue "${issue.title}" status changed to ${statusText}`,
					issueId: params.id
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating issue:', error);
			return fail(500, { message: 'Failed to update issue' });
		}
	}
};
