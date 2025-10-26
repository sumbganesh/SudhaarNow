import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import { put } from '@vercel/blob';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'citizen') {
		if (locals.user.role === 'authority') {
			throw redirect(302, '/authority');
		} else if (locals.user.role === 'admin') {
			throw redirect(302, '/admin');
		}
	}

	// Fetch issue categories
	const categories = await db.select().from(table.issueCategories);

	return {
		user: locals.user,
		categories
	};
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'citizen') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return fail(400, { message: 'No file provided' });
		}

		try {
			// Upload to Vercel Blob
			const { url } = await put(file.name, file, { 
				access: 'public',
				addRandomSuffix: true 
			});

			return { 
				success: true, 
				url: url,
				message: 'File uploaded successfully' 
			};
		} catch (error) {
			console.error('Upload error:', error);
			return fail(500, { message: 'Failed to upload file' });
		}
	},

	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'citizen') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const categoryId = formData.get('categoryId') as string;
		const locationLat = parseFloat(formData.get('locationLat') as string);
		const locationLng = parseFloat(formData.get('locationLng') as string);
		const locationAddress = formData.get('locationAddress') as string;
		
		// Handle photo uploads - now required
		let photos: string[] = [];
		const photoFiles = formData.getAll('photos') as File[];
		
		// Validate that at least one photo is provided
		if (!photoFiles || photoFiles.length === 0) {
			return fail(400, { message: 'At least one photo is required' });
		}
		
		try {
			// Upload each photo to Vercel Blob
			const uploadPromises = photoFiles.map(async (file) => {
				if (file && file.size > 0) {
					const { url } = await put(file.name, file, { 
						access: 'public',
						addRandomSuffix: true 
					});
					return url;
				}
				return null;
			});
			
			const uploadedUrls = await Promise.all(uploadPromises);
			photos = uploadedUrls.filter(url => url !== null) as string[];
			
			// Ensure at least one photo was successfully uploaded
			if (photos.length === 0) {
				return fail(400, { message: 'Failed to upload photos. Please try again.' });
			}
		} catch (error) {
			console.error('Error uploading photos:', error);
			return fail(500, { message: 'Failed to upload photos' });
		}

		if (!title || !description || !categoryId || !locationLat || !locationLng || !locationAddress) {
			return fail(400, { message: 'All fields are required' });
		}

		try {
			// Auto-assign to authority based on category
			const [assignedAuthority] = await db
				.select({ userId: table.authorities.userId })
				.from(table.authorities)
				.where(eq(table.authorities.categoryId, categoryId))
				.limit(1);

			// Create the issue
			const issueId = generateId(15);
			const newIssue: table.Issue = {
				id: issueId,
				title,
				description,
				categoryId,
				locationLat,
				locationLng,
				locationAddress,
				status: 'pending',
				postedByUserId: locals.user.id,
				assignedToAuthorityId: assignedAuthority?.userId || null,
				estimatedResolutionDate: null,
				actualResolutionDate: null,
				photos: photos,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null
			};

			await db.insert(table.issues).values(newIssue);

			// Award points for posting issue
			const { awardPoints, createNotification } = await import('$lib/server/gamification');
			await awardPoints({
				userId: locals.user.id,
				action: 'post_issue',
				issueId,
				points: 10
			});

			// Create notification for assigned authority
			if (assignedAuthority) {
				await createNotification({
					userId: assignedAuthority.userId,
					message: `New issue assigned: ${title}`,
					issueId
				});
			}

			return { success: true, message: 'Issue created successfully! You earned 10 points.' };
		} catch (error) {
			console.error('Error creating issue:', error);
			return fail(500, { message: 'Failed to create issue' });
		}
	}
};
