<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/wall');
	});
</script>

<svelte:head>
	<title>SudhaarNow - Civic Issue Platform</title>
	<meta name="description" content="A gamified platform for reporting and tracking civic issues" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">SudhaarNow</h1>
		<p class="text-lg text-gray-600 mb-8">Redirecting to public wall...</p>
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
	</div>
</div>
