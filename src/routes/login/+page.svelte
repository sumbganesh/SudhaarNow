<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let form;
	
	let isSubmitting = false;
</script>

<svelte:head>
	<title>Login - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sign in to your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Or
				<a href="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">
					create a new citizen account
				</a>
			</p>
		</div>

		<!-- Sample Accounts Display -->
		<div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
			<h3 class="text-sm font-medium text-blue-800 mb-2">Sample Accounts for Testing:</h3>
			<div class="text-xs text-blue-700 space-y-1">
				<div><strong>Citizen:</strong> citizen@test.com / Test123!</div>
				<div><strong>Authority:</strong> authority@test.com / Test123!</div>
				<div><strong>Admin:</strong> admin@test.com / Test123!</div>
			</div>
		</div>

		<form class="mt-8 space-y-6" method="POST" use:enhance onsubmit={() => { isSubmitting = true; }}>
			{#if form?.message}
				<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
					{form.message}
				</div>
			{/if}

			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Email address"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={isSubmitting}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<div class="flex items-center">
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
							Signing in...
						</div>
					{:else}
						Sign in
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
