import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, lte } from 'drizzle-orm';
import { generateId } from 'lucia';

/**
 * Admin endpoint to fix badge assignments for all users based on their current points
 * This corrects the bug where users were getting all badges instead of just the ones they earned
 */
export const POST: RequestHandler = async ({ locals }) => {
	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		console.log('🔧 Starting badge fix process...');

		// Get all users with their current points
		const users = await db
			.select({
				id: table.user.id,
				name: table.user.name,
				email: table.user.email,
				points: table.user.points,
				role: table.user.role
			})
			.from(table.user)
			.where(eq(table.user.role, 'citizen')); // Only fix badges for citizens

		console.log(`📊 Found ${users.length} citizens to process`);

		// Get all available badges
		const allBadges = await db
			.select()
			.from(table.badges)
			.orderBy(table.badges.pointsRequired);

		console.log(`🏆 Found ${allBadges.length} badges in system`);

		const results = [];

		// Process each user
		for (const user of users) {
			console.log(`\n👤 Processing ${user.name} (${user.email}) - ${user.points} points`);

			// Get badges this user should have based on their points
			const eligibleBadges = allBadges.filter(badge => badge.pointsRequired <= user.points);
			console.log(`   Should have ${eligibleBadges.length} badges`);

			// Get current badges for this user
			const currentUserBadges = await db
				.select({ badgeId: table.userBadges.badgeId })
				.from(table.userBadges)
				.where(eq(table.userBadges.userId, user.id));

			const currentBadgeIds = currentUserBadges.map(ub => ub.badgeId);
			console.log(`   Currently has ${currentBadgeIds.length} badges`);

			// Remove badges they shouldn't have
			const badgesToRemove = currentBadgeIds.filter(badgeId => {
				const badge = allBadges.find(b => b.id === badgeId);
				return badge && badge.pointsRequired > user.points;
			});

			if (badgesToRemove.length > 0) {
				console.log(`   ❌ Removing ${badgesToRemove.length} incorrect badges`);
				await db
					.delete(table.userBadges)
					.where(eq(table.userBadges.userId, user.id));
			}

			// Add badges they should have
			const badgesToAdd = eligibleBadges.filter(badge => !currentBadgeIds.includes(badge.id));
			
			if (badgesToAdd.length > 0) {
				console.log(`   ✅ Adding ${badgesToAdd.length} missing badges`);
				const newUserBadges = badgesToAdd.map(badge => ({
					id: generateId(15),
					userId: user.id,
					badgeId: badge.id,
					earnedAt: new Date()
				}));

				await db.insert(table.userBadges).values(newUserBadges);
			}

			// Track results
			results.push({
				userId: user.id,
				name: user.name,
				email: user.email,
				points: user.points,
				badgesRemoved: badgesToRemove.length,
				badgesAdded: badgesToAdd.length,
				eligibleBadges: eligibleBadges.length,
				status: badgesToRemove.length === 0 && badgesToAdd.length === 0 ? 'already_correct' : 'fixed'
			});
		}

		console.log('\n🎉 Badge fix process completed successfully!');

		return json({
			success: true,
			message: 'Badge assignments fixed successfully',
			summary: {
				totalUsers: users.length,
				totalBadges: allBadges.length,
				badgeRequirements: allBadges.map(b => ({ name: b.name, pointsRequired: b.pointsRequired }))
			},
			results
		});

	} catch (error) {
		console.error('❌ Error fixing badges:', error);
		return json({ 
			error: 'Failed to fix badges', 
			details: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};
