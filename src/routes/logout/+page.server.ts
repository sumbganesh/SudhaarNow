import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (locals.session) {
		await auth.invalidateSession(locals.session.id);
	}
	
	auth.deleteSessionTokenCookie({ cookies } as any);
	throw redirect(302, '/login');
};

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session) {
			await auth.invalidateSession(locals.session.id);
		}
		
		auth.deleteSessionTokenCookie({ cookies } as any);
		throw redirect(302, '/login');
	}
};
