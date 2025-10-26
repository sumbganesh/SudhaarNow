import { db } from './src/lib/server/db/index.js';
import * as table from './src/lib/server/db/schema.js';
import { eq, lte } from 'drizzle-orm';
import { generateId } from 'lucia';

/**
 * Script to fix badge assignments for all users based on their current points
 * This corrects the bug where users were getting all badges instead of just the ones they earned
 */

async function fixBadgeAssignments() {
	console.log('🔧 Starting badge fix process...');

	try {
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

			// If no changes needed
			if (badgesToRemove.length === 0 && badgesToAdd.length === 0) {
				console.log(`   ✅ Badges already correct`);
			}
		}

		console.log('\n🎉 Badge fix process completed successfully!');
		console.log('\n📋 Summary:');
		console.log(`   - Processed ${users.length} citizens`);
		console.log(`   - Available badges: ${allBadges.length}`);
		console.log(`   - Badge requirements: ${allBadges.map(b => `${b.name} (${b.pointsRequired} pts)`).join(', ')}`);

	} catch (error) {
		console.error('❌ Error fixing badges:', error);
		process.exit(1);
	}
}

// Run the fix
fixBadgeAssignments()
	.then(() => {
		console.log('\n✅ Script completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Script failed:', error);
		process.exit(1);
	});
