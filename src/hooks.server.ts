import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { validateEnvironmentOrThrow } from '$lib/server/env-validation';

// Validate environment variables on server startup
try {
	validateEnvironmentOrThrow();
} catch (error) {
	console.error('Server startup failed due to environment validation errors.');
	process.exit(1);
}

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	try {
		const { session, user } = await auth.validateSessionToken(sessionToken);

		if (session && user) {
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
			event.locals.user = user;
			event.locals.session = session;
		} else {
			// Invalid session - clear cookie and redirect to login
			auth.deleteSessionTokenCookie(event);
			event.locals.user = null;
			event.locals.session = null;
			
			// Only redirect to login if not already on login page
			if (event.url.pathname !== '/login') {
				throw redirect(302, '/login');
			}
		}
	} catch (error) {
		// Handle any errors during session validation
		console.error('Session validation error:', error);
		auth.deleteSessionTokenCookie(event);
		event.locals.user = null;
		event.locals.session = null;
		
		// Only redirect to login if not already on login page
		if (event.url.pathname !== '/login') {
			throw redirect(302, '/login');
		}
	}

	return resolve(event);
};

export const handle: Handle = handleAuth;
