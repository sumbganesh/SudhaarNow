import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { notificationId } = await request.json();

		if (!notificationId) {
			return json({ error: 'Notification ID is required' }, { status: 400 });
		}

		// Mark notification as read
		await db
			.update(table.notifications)
			.set({ read: true })
			.where(
				and(
					eq(table.notifications.id, notificationId),
					eq(table.notifications.userId, locals.user.id)
				)
			);

		return json({ success: true });
	} catch (error) {
		console.error('Error marking notification as read:', error);
		return json({ error: 'Failed to mark notification as read' }, { status: 500 });
	}
};
