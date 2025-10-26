<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	let showCreateBadgeDialog = false;
	let showEditBadgeDialog = false;
	let showResetDialog = false;
	let selectedBadge: any = null;
	let selectedUserId = '';

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function openEditBadgeDialog(badge: any) {
		selectedBadge = badge;
		showEditBadgeDialog = true;
	}

	function handleFormSuccess(result: any) {
		if (result.type === 'success') {
			toast.success(result.message || 'Operation completed successfully');
			showCreateBadgeDialog = false;
			showEditBadgeDialog = false;
			showResetDialog = false;
			selectedBadge = null;
			selectedUserId = '';
		}
	}

	function handleFormError(result: any) {
		if (result.type === 'error') {
			toast.error(result.message || 'Operation failed');
		}
	}
</script>

<svelte:head>
	<title>System Settings - Admin Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center space-x-4">
					<a href="/admin" class="text-gray-500 hover:text-gray-700" aria-label="Back to admin dashboard">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</a>
					<h1 class="text-2xl font-bold text-gray-900">System Settings</h1>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- System Statistics -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">👥</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.users}</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">📝</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Issues</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.issues}</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">✅</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Resolved</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.resolved}</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">📊</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Resolution Rate</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.resolutionRate}%</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Badge Management -->
			<Card class="mb-8">
				<CardHeader>
					<div class="flex justify-between items-center">
						<div>
							<CardTitle>Badge Management</CardTitle>
							<CardDescription>
								Manage badges and their point requirements
							</CardDescription>
						</div>
						<Dialog bind:open={showCreateBadgeDialog}>
							<DialogTrigger>
								<Button>Create Badge</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Create New Badge</DialogTitle>
									<DialogDescription>
										Create a new badge with point requirements.
									</DialogDescription>
								</DialogHeader>
								<form method="POST" action="?/createBadge" use:enhance={handleFormSuccess}>
									<div class="space-y-4">
										<div>
											<label for="name" class="block text-sm font-medium text-gray-700">Badge Name</label>
											<Input id="name" name="name" placeholder="e.g., Active Citizen" required />
										</div>
										<div>
											<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
											<Textarea id="description" name="description" placeholder="Description of this badge..." />
										</div>
										<div>
											<label for="pointsRequired" class="block text-sm font-medium text-gray-700">Points Required</label>
											<Input 
												id="pointsRequired" 
												name="pointsRequired" 
												type="number" 
												min="0" 
												placeholder="50" 
												required 
											/>
										</div>
										<div>
											<label for="icon" class="block text-sm font-medium text-gray-700">Icon</label>
											<Input id="icon" name="icon" placeholder="🏆" required />
											<p class="text-xs text-gray-500 mt-1">Use emoji or icon text</p>
										</div>
									</div>
									<DialogFooter>
										<Button 
										type="button" 
										variant="outline" 
										onclick={() => showCreateBadgeDialog = false}
									>Cancel</Button>
										<Button type="submit">Create Badge</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{#if data.badges.length === 0}
						<div class="text-center py-12">
							<div class="mx-auto h-12 w-12 text-gray-400">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
								</svg>
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No badges created</h3>
							<p class="mt-1 text-sm text-gray-500">Create your first badge to get started.</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each data.badges as badge}
								<Card>
									<CardContent class="p-4">
										<div class="flex items-start justify-between">
											<div class="flex items-center space-x-3">
												<div class="text-2xl">{badge.icon}</div>
												<div>
													<h3 class="font-medium text-gray-900">{badge.name}</h3>
													{#if badge.description}
														<p class="text-sm text-gray-500">{badge.description}</p>
													{/if}
													<div class="mt-2 flex items-center space-x-2">
														<Badge variant="outline">{badge.pointsRequired} points</Badge>
														<span class="text-xs text-gray-500">{badge.userCount} earned</span>
													</div>
												</div>
											</div>
											<div class="flex space-x-1">
												<Button 
													variant="outline" 
													size="sm"
													onclick={() => openEditBadgeDialog(badge)}
												>
													Edit
												</Button>
												<form method="POST" action="?/deleteBadge" use:enhance={handleFormError} class="inline">
													<input type="hidden" name="badgeId" value={badge.id} />
													<Button 
														type="submit" 
														variant="destructive" 
														size="sm"
														onclick={(e) => {
															if (!confirm('Are you sure you want to delete this badge?')) {
																e.preventDefault();
															}
														}}
													>
														Delete
													</Button>
												</form>
											</div>
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Recent Activity -->
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Latest issues reported on the platform
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.recentIssues.length === 0}
						<div class="text-center py-12">
							<div class="mx-auto h-12 w-12 text-gray-400">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
							<p class="mt-1 text-sm text-gray-500">Issues will appear here as citizens report them.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each data.recentIssues as { issue, category, postedBy }}
								<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{issue.title}</h4>
										<p class="text-sm text-gray-500">{issue.description}</p>
										<div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
											<span>Category: {category?.name}</span>
											<span>By: {postedBy?.name}</span>
											<span>{formatDate(issue.createdAt)}</span>
										</div>
									</div>
									<Badge class={
										issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
										issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
										issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
										'bg-red-100 text-red-800'
									}>
										{issue.status === 'pending' ? 'Pending' :
										 issue.status === 'in_progress' ? 'In Progress' :
										 issue.status === 'resolved' ? 'Resolved' :
										 issue.status === 'fake' ? 'Marked as Fake' :
										 issue.status}
									</Badge>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</main>
</div>

<!-- Edit Badge Dialog -->
<Dialog bind:open={showEditBadgeDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Edit Badge</DialogTitle>
			<DialogDescription>
				Update badge information and point requirements.
			</DialogDescription>
		</DialogHeader>
		{#if selectedBadge}
			<form method="POST" action="?/updateBadge" use:enhance={handleFormSuccess}>
				<input type="hidden" name="badgeId" value={selectedBadge.id} />
				<div class="space-y-4">
					<div>
						<label for="edit-name" class="block text-sm font-medium text-gray-700">Badge Name</label>
						<Input id="edit-name" name="name" value={selectedBadge.name} required />
					</div>
					<div>
						<label for="edit-description" class="block text-sm font-medium text-gray-700">Description</label>
						<Textarea id="edit-description" name="description" value={selectedBadge.description || ''} />
					</div>
					<div>
						<label for="edit-pointsRequired" class="block text-sm font-medium text-gray-700">Points Required</label>
						<Input 
							id="edit-pointsRequired" 
							name="pointsRequired" 
							type="number" 
							min="0" 
							value={selectedBadge.pointsRequired} 
							required 
						/>
					</div>
					<div>
						<label for="edit-icon" class="block text-sm font-medium text-gray-700">Icon</label>
						<Input id="edit-icon" name="icon" value={selectedBadge.icon} required />
						<p class="text-xs text-gray-500 mt-1">Use emoji or icon text</p>
					</div>
				</div>
				<DialogFooter>
					<Button 
						type="button" 
						variant="outline" 
						onclick={() => showEditBadgeDialog = false}
					>Cancel</Button>
					<Button type="submit">Update Badge</Button>
				</DialogFooter>
			</form>
		{/if}
	</DialogContent>
</Dialog>
