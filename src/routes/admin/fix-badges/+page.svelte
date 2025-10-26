<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';

	let isRunning = false;
	let results: any = null;
	let summary: any = null;

	async function fixBadges() {
		isRunning = true;
		results = null;
		summary = null;

		try {
			const response = await fetch('/admin/fix-badges', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (data.success) {
				results = data.results;
				summary = data.summary;
				toast.success('Badge fix completed successfully!', {
					description: `Processed ${data.summary.totalUsers} users`
				});
			} else {
				toast.error('Failed to fix badges', {
					description: data.error || 'Unknown error'
				});
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Failed to fix badges', {
				description: 'Network error or server issue'
			});
		} finally {
			isRunning = false;
		}
	}
</script>

<svelte:head>
	<title>Fix Badge Assignments - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<Button variant="ghost">
						<a href="/admin">← Back to Admin</a>
					</Button>
					<h1 class="text-2xl font-bold text-gray-900 ml-4">Fix Badge Assignments</h1>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0 space-y-6">
			
			<!-- Info Card -->
			<Card>
				<CardHeader>
					<CardTitle>Badge Fix Tool</CardTitle>
					<CardDescription>
						This tool fixes the badge assignment bug where users were getting all badges instead of just the ones they earned based on their points.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
									</svg>
								</div>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-yellow-800">What this tool does:</h3>
									<div class="mt-2 text-sm text-yellow-700">
										<ul class="list-disc list-inside space-y-1">
											<li>Removes badges that users don't qualify for based on their current points</li>
											<li>Adds badges that users should have earned based on their points</li>
											<li>Only affects citizen users (authorities and admins are not affected)</li>
											<li>Preserves the correct badge assignments</li>
										</ul>
									</div>
								</div>
							</div>
						</div>

						<Button 
							onclick={fixBadges} 
							disabled={isRunning}
							class="w-full"
						>
							{#if isRunning}
								<div class="flex items-center">
									<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
									Fixing Badges...
								</div>
							{:else}
								🔧 Fix Badge Assignments
							{/if}
						</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Results -->
			{#if summary}
				<Card>
					<CardHeader>
						<CardTitle>Fix Results</CardTitle>
						<CardDescription>Summary of the badge fix operation</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="bg-blue-50 p-4 rounded-lg">
									<div class="text-2xl font-bold text-blue-600">{summary.totalUsers}</div>
									<div class="text-sm text-blue-800">Users Processed</div>
								</div>
								<div class="bg-green-50 p-4 rounded-lg">
									<div class="text-2xl font-bold text-green-600">{summary.totalBadges}</div>
									<div class="text-sm text-green-800">Available Badges</div>
								</div>
								<div class="bg-purple-50 p-4 rounded-lg">
									<div class="text-2xl font-bold text-purple-600">
										{results?.filter((r: any) => r.status === 'fixed').length || 0}
									</div>
									<div class="text-sm text-purple-800">Users Fixed</div>
								</div>
							</div>

							<div>
								<h4 class="font-medium text-gray-900 mb-2">Badge Requirements:</h4>
								<div class="space-y-1">
									{#each summary.badgeRequirements as badge}
										<div class="flex justify-between items-center py-1">
											<span class="text-sm text-gray-700">{badge.name}</span>
											<Badge variant="secondary">{badge.pointsRequired} pts</Badge>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Detailed Results -->
			{#if results}
				<Card>
					<CardHeader>
						<CardTitle>Detailed Results</CardTitle>
						<CardDescription>Individual user badge fix results</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							{#each results as result}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
									<div class="flex-1">
										<div class="font-medium text-gray-900">{result.name}</div>
										<div class="text-sm text-gray-500">{result.email}</div>
									</div>
									<div class="flex items-center space-x-4">
										<div class="text-sm text-gray-600">{result.points} pts</div>
										<div class="text-sm text-gray-600">{result.eligibleBadges} badges</div>
										{#if result.badgesRemoved > 0}
											<Badge variant="destructive">-{result.badgesRemoved}</Badge>
										{/if}
										{#if result.badgesAdded > 0}
											<Badge variant="default">+{result.badgesAdded}</Badge>
										{/if}
										{#if result.status === 'already_correct'}
											<Badge variant="secondary">✓ Correct</Badge>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</main>
</div>
