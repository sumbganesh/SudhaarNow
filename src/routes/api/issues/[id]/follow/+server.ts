import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from 'lucia';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const issueId = params.id;
		const userId = locals.user.id;

		// Check if user is already following this issue
		const existingFollow = await db
			.select()
			.from(table.issueFollowers)
			.where(
				and(
					eq(table.issueFollowers.issueId, issueId),
					eq(table.issueFollowers.userId, userId)
				)
			)
			.limit(1);

		if (existingFollow.length > 0) {
			// User is already following, so unfollow
			await db
				.delete(table.issueFollowers)
				.where(
					and(
						eq(table.issueFollowers.issueId, issueId),
						eq(table.issueFollowers.userId, userId)
					)
				);

			return json({ success: true, following: false });
		} else {
			// User is not following, so follow
			await db.insert(table.issueFollowers).values({
				id: generateId(15),
				userId,
				issueId,
				createdAt: new Date()
			});

			return json({ success: true, following: true });
		}
	} catch (error) {
		console.error('Error toggling issue follow:', error);
		return json({ error: 'Failed to toggle follow status' }, { status: 500 });
	}
};
