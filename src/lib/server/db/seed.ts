import { db } from './index';
import * as table from './schema';
import { hash } from 'argon2';
import { generateId } from 'lucia';

export async function seedDatabase() {
	console.log('🌱 Seeding database...');

	try {
		// Create sample users
		const citizenId = generateId(15);
		const authorityId = generateId(15);
		const adminId = generateId(15);

		const passwordHash = await hash('Test123!');

		const users = [
			{
				id: citizenId,
				email: 'citizen@test.com',
				passwordHash,
				role: 'citizen' as const,
				name: 'John Citizen',
				phone: '+1234567890',
				points: 0,
				createdAt: new Date()
			},
			{
				id: authorityId,
				email: 'authority@test.com',
				passwordHash,
				role: 'authority' as const,
				name: 'Jane Authority',
				phone: '+1234567891',
				points: 0,
				createdAt: new Date()
			},
			{
				id: adminId,
				email: 'admin@test.com',
				passwordHash,
				role: 'admin' as const,
				name: 'Admin User',
				phone: '+1234567892',
				points: 0,
				createdAt: new Date()
			}
		];

		await db.insert(table.user).values(users);

		// Create issue categories based on issuelist.md
		const categories = [
			{
				id: generateId(15),
				name: 'Road Potholes',
				description: 'Potholes and uneven road surfaces',
				department: 'Municipal Corporation',
				defaultEstimateHours: 168, // 7 days
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Garbage Overflow',
				description: 'Uncollected waste and garbage overflow',
				department: 'Municipal Corporation',
				defaultEstimateHours: 24, // 1 day
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Streetlight Issues',
				description: 'Non-working or flickering streetlights',
				department: 'Electricity Board',
				defaultEstimateHours: 72, // 3 days
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Traffic Signal Problems',
				description: 'Malfunctioning traffic signals',
				department: 'Traffic Police',
				defaultEstimateHours: 48, // 2 days
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Water Supply Issues',
				description: 'Leaking taps, burst pipelines',
				department: 'Water Supply Board',
				defaultEstimateHours: 24, // 1 day
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Public Toilet Issues',
				description: 'Cleanliness and availability of public toilets',
				department: 'Municipal Corporation',
				defaultEstimateHours: 12, // 12 hours
				createdAt: new Date()
			}
		];

		await db.insert(table.issueCategories).values(categories);

		// Assign authority to categories (authority can handle multiple categories)
		const authorityAssignments = [
			{
				id: generateId(15),
				userId: authorityId,
				categoryId: categories[0].id, // Road Potholes
				createdAt: new Date()
			},
			{
				id: generateId(15),
				userId: authorityId,
				categoryId: categories[1].id, // Garbage Overflow
				createdAt: new Date()
			},
			{
				id: generateId(15),
				userId: authorityId,
				categoryId: categories[5].id, // Public Toilet Issues
				createdAt: new Date()
			}
		];

		await db.insert(table.authorities).values(authorityAssignments);

		// Create default badges
		const badges = [
			{
				id: generateId(15),
				name: 'Starter',
				description: 'Welcome to the community!',
				pointsRequired: 0,
				icon: '🌟',
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Active Citizen',
				description: 'You\'re making a difference!',
				pointsRequired: 50,
				icon: '🏆',
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Champion',
				description: 'A true community champion!',
				pointsRequired: 150,
				icon: '🥇',
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Hero',
				description: 'You\'re a community hero!',
				pointsRequired: 300,
				icon: '🦸',
				createdAt: new Date()
			},
			{
				id: generateId(15),
				name: 'Legend',
				description: 'A legendary community member!',
				pointsRequired: 500,
				icon: '👑',
				createdAt: new Date()
			}
		];

		await db.insert(table.badges).values(badges);

		// Give starter badge to all users
		const userBadges = [
			{
				id: generateId(15),
				userId: citizenId,
				badgeId: badges[0].id, // Starter
				earnedAt: new Date()
			},
			{
				id: generateId(15),
				userId: authorityId,
				badgeId: badges[0].id, // Starter
				earnedAt: new Date()
			},
			{
				id: generateId(15),
				userId: adminId,
				badgeId: badges[0].id, // Starter
				earnedAt: new Date()
			}
		];

		await db.insert(table.userBadges).values(userBadges);

		console.log('✅ Database seeded successfully!');
		console.log('📧 Sample accounts created:');
		console.log('   Citizen: citizen@test.com / Test123!');
		console.log('   Authority: authority@test.com / Test123!');
		console.log('   Admin: admin@test.com / Test123!');
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}
