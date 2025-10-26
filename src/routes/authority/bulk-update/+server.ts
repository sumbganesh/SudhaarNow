import type { RequestHandler } from './$types';
import { json, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, inArray, and, isNull } from 'drizzle-orm';
import { generateId } from 'lucia';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'authority') {
		return fail(403, { message: 'Unauthorized' });
	}

	const formData = await request.formData();
	const issueIds = formData.get('issueIds') as string;
	const status = formData.get('status') as string;
	const comment = formData.get('comment') as string;

	if (!issueIds || !status) {
		return fail(400, { message: 'Issue IDs and status are required' });
	}

	const issueIdArray = issueIds.split(',').filter(Boolean);

	try {
		// Update all issues
		const updateData: any = {
			status,
			updatedAt: new Date()
		};

		if (status === 'resolved') {
			updateData.actualResolutionDate = new Date();
		}

		await db
			.update(table.issues)
			.set(updateData)
			.where(
				and(
					inArray(table.issues.id, issueIdArray),
					isNull(table.issues.deletedAt)
				)
			);

		// Create audit trail entries for each issue
		const updatePromises = issueIdArray.map(issueId => {
			const updateId = generateId(15);
			return db.insert(table.issueUpdates).values({
				id: updateId,
				issueId,
				authorityId: locals.user.id,
				comment: comment || null,
				statusChange: status,
				createdAt: new Date()
			});
		});

		await Promise.all(updatePromises);

		// Award points and create notifications
		const { awardPoints, createNotification } = await import('$lib/server/gamification');
		
		// Get the issues to find the original posters
		const issues = await db
			.select({ 
				postedByUserId: table.issues.postedByUserId,
				title: table.issues.title
			})
			.from(table.issues)
			.where(inArray(table.issues.id, issueIdArray));

		// Process each issue for points and notifications
		for (const issue of issues) {
			if (status === 'resolved') {
				// Award points to the original poster
				await awardPoints({
					userId: issue.postedByUserId,
					action: 'issue_resolved',
					issueId: issueIdArray[0], // Use first issue ID for the action
					points: 20
				});
			} else if (status === 'fake') {
				// Deduct points for fake issue
				await awardPoints({
					userId: issue.postedByUserId,
					action: 'issue_fake',
					issueId: issueIdArray[0], // Use first issue ID for the action
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
				issueId: issueIdArray[0] // Use first issue ID for the notification
			});
		}

		return json({ 
			success: true, 
			message: `Successfully updated ${issueIdArray.length} issue${issueIdArray.length === 1 ? '' : 's'}` 
		});
	} catch (error) {
		console.error('Error updating issues:', error);
		return fail(500, { message: 'Failed to update issues' });
	}
};
