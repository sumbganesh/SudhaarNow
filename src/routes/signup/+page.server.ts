import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { hash } from 'argon2';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		// Redirect based on role
		if (locals.user.role === 'citizen') {
			throw redirect(302, '/citizen');
		} else if (locals.user.role === 'authority') {
			throw redirect(302, '/authority');
		} else if (locals.user.role === 'admin') {
			throw redirect(302, '/admin');
		}
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const name = formData.get('name') as string;
		const phone = formData.get('phone') as string;

		if (!email || !password || !name) {
			return fail(400, {
				message: 'Email, password, and name are required'
			});
		}

		if (password.length < 6) {
			return fail(400, {
				message: 'Password must be at least 6 characters long'
			});
		}

		// Check if user already exists
		const [existingUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, email))
			.limit(1);

		if (existingUser) {
			return fail(400, {
				message: 'User with this email already exists'
			});
		}

		// Hash password
		const passwordHash = await hash(password);

		// Create user (only citizens can signup)
		const userId = generateId(15);
		const newUser: table.User = {
			id: userId,
			email,
			passwordHash,
			role: 'citizen',
			name,
			phone: phone || null,
			points: 0,
			createdAt: new Date()
		};

		try {
			await db.insert(table.user).values(newUser);

			// Create session
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);

			// Set cookie
			auth.setSessionTokenCookie({ cookies } as any, sessionToken, session.expiresAt);
		} catch (error) {
			console.error('Database error during signup:', error);
			return fail(500, {
				message: 'An error occurred during signup'
			});
		}

		// Redirect to citizen dashboard
		throw redirect(302, '/citizen');
	}
};
