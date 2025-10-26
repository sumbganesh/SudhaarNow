import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, isNull, count, desc, like, or } from 'drizzle-orm';
import { generateId } from 'lucia';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	const search = url.searchParams.get('search') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	// Build query conditions
	const conditions = [];
	if (search) {
		conditions.push(
			or(
				like(table.issueCategories.name, `%${search}%`),
				like(table.issueCategories.department, `%${search}%`)
			)
		);
	}

	// Get categories with pagination
	const categories = await db
		.select({
			id: table.issueCategories.id,
			name: table.issueCategories.name,
			description: table.issueCategories.description,
			department: table.issueCategories.department,
			defaultEstimateHours: table.issueCategories.defaultEstimateHours,
			createdAt: table.issueCategories.createdAt,
			issueCount: count(table.issues.id),
			authorityCount: count(table.authorities.id)
		})
		.from(table.issueCategories)
		.leftJoin(table.issues, eq(table.issueCategories.id, table.issues.categoryId))
		.leftJoin(table.authorities, eq(table.issueCategories.id, table.authorities.categoryId))
		.where(conditions.length > 0 ? or(...conditions) : undefined)
		.groupBy(table.issueCategories.id)
		.orderBy(desc(table.issueCategories.createdAt))
		.limit(limit)
		.offset(offset);

	// Get total count for pagination
	const [totalCount] = await db
		.select({ count: count() })
		.from(table.issueCategories)
		.where(conditions.length > 0 ? or(...conditions) : undefined);

	return {
		categories,
		pagination: {
			page,
			limit,
			total: totalCount.count,
			totalPages: Math.ceil(totalCount.count / limit)
		},
		filters: { search }
	};
};

export const actions: Actions = {
	createCategory: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const department = data.get('department') as string;
		const defaultEstimateHours = parseInt(data.get('defaultEstimateHours') as string);

		if (!name || !department || !defaultEstimateHours) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			const categoryId = generateId(15);

			await db.insert(table.issueCategories).values({
				id: categoryId,
				name,
				description: description || null,
				department,
				defaultEstimateHours
			});

			return { success: true, message: 'Category created successfully' };
		} catch (error) {
			console.error('Error creating category:', error);
			return fail(500, { message: 'Failed to create category' });
		}
	},

	updateCategory: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const categoryId = data.get('categoryId') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const department = data.get('department') as string;
		const defaultEstimateHours = parseInt(data.get('defaultEstimateHours') as string);

		if (!categoryId || !name || !department || !defaultEstimateHours) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await db
				.update(table.issueCategories)
				.set({
					name,
					description: description || null,
					department,
					defaultEstimateHours
				})
				.where(eq(table.issueCategories.id, categoryId));

			return { success: true, message: 'Category updated successfully' };
		} catch (error) {
			console.error('Error updating category:', error);
			return fail(500, { message: 'Failed to update category' });
		}
	},

	deleteCategory: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const categoryId = data.get('categoryId') as string;

		if (!categoryId) {
			return fail(400, { message: 'Category ID is required' });
		}

		try {
			// Check if category has any issues
			const [issueCount] = await db
				.select({ count: count() })
				.from(table.issues)
				.where(eq(table.issues.categoryId, categoryId));

			if (issueCount.count > 0) {
				return fail(400, { message: 'Cannot delete category with existing issues' });
			}

			await db.delete(table.issueCategories).where(eq(table.issueCategories.id, categoryId));
			return { success: true, message: 'Category deleted successfully' };
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { message: 'Failed to delete category' });
		}
	}
};
