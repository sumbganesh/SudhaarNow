import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, isNull, count, desc, like, or, and } from 'drizzle-orm';
import { hash } from 'argon2';
import { generateId } from 'lucia';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	const search = url.searchParams.get('search') || '';
	const role = url.searchParams.get('role') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	// Build query conditions
	const conditions = [];
	if (search) {
		conditions.push(
			or(
				like(table.user.name, `%${search}%`),
				like(table.user.email, `%${search}%`)
			)
		);
	}
	if (role) {
		conditions.push(eq(table.user.role, role as 'citizen' | 'authority' | 'admin'));
	}

	// Get users with pagination
	const users = await db
		.select({
			id: table.user.id,
			name: table.user.name,
			email: table.user.email,
			role: table.user.role,
			phone: table.user.phone,
			points: table.user.points,
			createdAt: table.user.createdAt,
			issueCount: count(table.issues.id)
		})
		.from(table.user)
		.leftJoin(table.issues, eq(table.user.id, table.issues.postedByUserId))
		.where(conditions.length > 0 ? or(...conditions) : undefined)
		.groupBy(table.user.id)
		.orderBy(desc(table.user.createdAt))
		.limit(limit)
		.offset(offset);

	// Get total count for pagination
	const [totalCount] = await db
		.select({ count: count() })
		.from(table.user)
		.where(conditions.length > 0 ? or(...conditions) : undefined);

	// Get all categories for authority assignment
	const categories = await db.select().from(table.issueCategories);

	// Get existing authorities with their categories
	const authorities = await db
		.select({
			authority: table.authorities,
			user: table.user,
			category: table.issueCategories
		})
		.from(table.authorities)
		.leftJoin(table.user, eq(table.authorities.userId, table.user.id))
		.leftJoin(table.issueCategories, eq(table.authorities.categoryId, table.issueCategories.id));

	return {
		users,
		categories,
		authorities,
		pagination: {
			page,
			limit,
			total: totalCount.count,
			totalPages: Math.ceil(totalCount.count / limit)
		},
		filters: { search, role }
	};
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const role = data.get('role') as 'citizen' | 'authority' | 'admin';
		const phone = data.get('phone') as string;

		if (!name || !email || !password || !role) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			// Check if user already exists
			const existingUser = await db.select().from(table.user).where(eq(table.user.email, email)).limit(1);
			if (existingUser.length > 0) {
				return fail(400, { message: 'User with this email already exists' });
			}

			const userId = generateId(15);
			const passwordHash = await hash(password);

			await db.insert(table.user).values({
				id: userId,
				name,
				email,
				passwordHash,
				role,
				phone: phone || null,
				points: 0
			});

			return { success: true, message: 'User created successfully' };
		} catch (error) {
			console.error('Error creating user:', error);
			return fail(500, { message: 'Failed to create user' });
		}
	},

	updateUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const role = data.get('role') as 'citizen' | 'authority' | 'admin';
		const phone = data.get('phone') as string;
		const points = parseInt(data.get('points') as string);

		if (!userId || !name || !email || !role) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await db
				.update(table.user)
				.set({
					name,
					email,
					role,
					phone: phone || null,
					points: points || 0
				})
				.where(eq(table.user.id, userId));

			return { success: true, message: 'User updated successfully' };
		} catch (error) {
			console.error('Error updating user:', error);
			return fail(500, { message: 'Failed to update user' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'User ID is required' });
		}

		try {
			// Don't allow deleting the current admin user
			if (userId === locals.user.id) {
				return fail(400, { message: 'Cannot delete your own account' });
			}

			await db.delete(table.user).where(eq(table.user.id, userId));
			return { success: true, message: 'User deleted successfully' };
		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(500, { message: 'Failed to delete user' });
		}
	},

	assignAuthority: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const categoryId = data.get('categoryId') as string;

		if (!userId || !categoryId) {
			return fail(400, { message: 'User ID and Category ID are required' });
		}

		try {
			// Check if user is already an authority for this category
			const existingAuthority = await db
				.select()
				.from(table.authorities)
				.where(
					and(
						eq(table.authorities.userId, userId),
						eq(table.authorities.categoryId, categoryId)
					)
				)
				.limit(1);

			if (existingAuthority.length > 0) {
				return fail(400, { message: 'User is already an authority for this category' });
			}

			const authorityId = generateId(15);
			await db.insert(table.authorities).values({
				id: authorityId,
				userId,
				categoryId
			});

			return { success: true, message: 'Authority assigned successfully' };
		} catch (error) {
			console.error('Error assigning authority:', error);
			return fail(500, { message: 'Failed to assign authority' });
		}
	},

	removeAuthority: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const authorityId = data.get('authorityId') as string;

		if (!authorityId) {
			return fail(400, { message: 'Authority ID is required' });
		}

		try {
			await db.delete(table.authorities).where(eq(table.authorities.id, authorityId));
			return { success: true, message: 'Authority removed successfully' };
		} catch (error) {
			console.error('Error removing authority:', error);
			return fail(500, { message: 'Failed to remove authority' });
		}
	}
};
