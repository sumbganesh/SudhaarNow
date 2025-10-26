import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { verify } from 'argon2';
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

		if (!email || !password) {
			return fail(400, {
				message: 'Email and password are required'
			});
		}

		// Find user by email
		const [existingUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, email))
			.limit(1);

		if (!existingUser) {
			return fail(400, {
				message: 'Invalid email or password'
			});
		}

		// Verify password
		const validPassword = await verify(existingUser.passwordHash, password);
		if (!validPassword) {
			return fail(400, {
				message: 'Invalid email or password'
			});
		}

		try {
			// Create session
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, existingUser.id);

			// Set cookie
			auth.setSessionTokenCookie({ cookies } as any, sessionToken, session.expiresAt);
		} catch (error) {
			console.error('Session creation error:', error);
			return fail(500, {
				message: 'An error occurred during login'
			});
		}

		// Redirect based on role
		if (existingUser.role === 'citizen') {
			throw redirect(302, '/citizen');
		} else if (existingUser.role === 'authority') {
			throw redirect(302, '/authority');
		} else if (existingUser.role === 'admin') {
			throw redirect(302, '/admin');
		}
	}
};
