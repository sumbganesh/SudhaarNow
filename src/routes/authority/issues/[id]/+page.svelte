<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';

	export let data: PageData;
	export let form;
	
	let isSubmitting = false;

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'in_progress':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'resolved':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'fake':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'pending':
				return 'Pending';
			case 'in_progress':
				return 'In Progress';
			case 'resolved':
				return 'Resolved';
			case 'fake':
				return 'Marked as Fake';
			default:
				return status;
		}
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getPriorityColor(createdAt: Date) {
		const daysSinceCreated = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceCreated > 7) return 'text-red-600';
		if (daysSinceCreated > 3) return 'text-yellow-600';
		return 'text-green-600';
	}

	function getPriorityText(createdAt: Date) {
		const daysSinceCreated = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceCreated > 7) return 'High Priority';
		if (daysSinceCreated > 3) return 'Medium Priority';
		return 'Low Priority';
	}
</script>

<svelte:head>
	<title>Issue Details - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<Button variant="outline" size="sm" href="/authority" class="mr-4">
						← Back to Dashboard
					</Button>
					<h1 class="text-2xl font-bold text-gray-900">Issue Details</h1>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Issue Details -->
				<div class="lg:col-span-2 space-y-6">
					<!-- Issue Information -->
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle class="text-xl">{data.issue.title}</CardTitle>
								<Badge class={getStatusColor(data.issue.status)}>
									{getStatusText(data.issue.status)}
								</Badge>
							</div>
							<CardDescription>
								<span class={getPriorityColor(data.issue.createdAt)}>
									{getPriorityText(data.issue.createdAt)}
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p class="text-gray-600 mb-4">{data.issue.description}</p>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<span class="text-sm font-medium text-gray-500">Category</span>
									<p class="text-sm text-gray-900">{data.category?.name} ({data.category?.department})</p>
								</div>
								<div>
									<span class="text-sm font-medium text-gray-500">Reported by</span>
									<p class="text-sm text-gray-900">{data.postedBy?.name}</p>
									<p class="text-xs text-gray-500">{data.postedBy?.email}</p>
								</div>
								<div>
									<span class="text-sm font-medium text-gray-500">Location</span>
									<p class="text-sm text-gray-900">{data.issue.locationAddress}</p>
								</div>
								<div>
									<span class="text-sm font-medium text-gray-500">Reported on</span>
									<p class="text-sm text-gray-900">{formatDate(data.issue.createdAt)}</p>
								</div>
								{#if data.issue.estimatedResolutionDate}
									<div>
										<span class="text-sm font-medium text-gray-500">Estimated Resolution</span>
										<p class="text-sm text-gray-900">{formatDate(data.issue.estimatedResolutionDate)}</p>
									</div>
								{/if}
								{#if data.issue.actualResolutionDate}
									<div>
										<span class="text-sm font-medium text-gray-500">Actual Resolution</span>
										<p class="text-sm text-gray-900">{formatDate(data.issue.actualResolutionDate)}</p>
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>

					<!-- Photos Section -->
					{#if data.issue.photos && data.issue.photos.length > 0}
						<Card>
							<CardHeader>
								<CardTitle>Issue Photos</CardTitle>
								<CardDescription>Photos provided by the reporter</CardDescription>
							</CardHeader>
							<CardContent>
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each data.issue.photos as photo}
										<div class="relative group">
											<div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
												<img 
													src={photo} 
													alt="Issue evidence" 
													class="w-full h-full object-cover rounded-lg"
													onerror={(e) => {
														const target = e.target as HTMLImageElement;
														if (target) {
															target.style.display = 'none';
															const nextElement = target.nextElementSibling as HTMLElement;
															if (nextElement) {
																nextElement.style.display = 'flex';
															}
														}
													}}
													onload={(e) => {
														const target = e.target as HTMLImageElement;
														if (target) {
															const nextElement = target.nextElementSibling as HTMLElement;
															if (nextElement) {
																nextElement.style.display = 'none';
															}
														}
													}}
												/>
												<div class="hidden w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
													<div class="text-center">
														<svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
														</svg>
														<p class="text-sm">Image failed to load</p>
													</div>
												</div>
											</div>
											<div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
												<Button 
													size="sm" 
													variant="secondary" 
													class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
													onclick={() => window.open(photo, '_blank')}
												>
													View Full Size
												</Button>
											</div>
										</div>
									{/each}
								</div>
							</CardContent>
						</Card>
					{/if}

					<!-- Status Update Form -->
					<Card>
						<CardHeader>
							<CardTitle>Update Status</CardTitle>
							<CardDescription>Update the status and add comments for this issue</CardDescription>
						</CardHeader>
						<CardContent>
							<form method="POST" action="?/updateStatus" use:enhance class="space-y-4" onsubmit={() => { isSubmitting = true; }}>
								{#if form?.message}
									<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
										{form.message}
									</div>
								{/if}

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
										<Select.Root name="status" type="single" bind:value={data.issue.status}>
											<Select.Trigger>
												<Select.Value placeholder="Select status" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="pending">Pending</Select.Item>
												<Select.Item value="in_progress">In Progress</Select.Item>
												<Select.Item value="resolved">Resolved</Select.Item>
												<Select.Item value="fake">Mark as Fake</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>

									<div>
										<label for="estimatedDate" class="block text-sm font-medium text-gray-700 mb-2">Estimated Resolution Date</label>
										<Input
											type="datetime-local"
											name="estimatedDate"
											id="estimatedDate"
											placeholder="Select date and time"
										/>
									</div>
								</div>

								<div>
									<label for="comment" class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
									<Textarea
										name="comment"
										id="comment"
										rows={4}
										placeholder="Add a comment about this update..."
									/>
								</div>

								<div class="flex justify-end">
									<Button type="submit" disabled={isSubmitting}>
										{#if isSubmitting}
											<div class="flex items-center">
												<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
												Updating...
											</div>
										{:else}
											Update Status
										{/if}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				<!-- Activity Log -->
				<div class="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle>Activity Log</CardTitle>
							<CardDescription>Recent updates and changes</CardDescription>
						</CardHeader>
						<CardContent>
							{#if data.updates.length === 0}
								<div class="text-center py-8">
									<div class="mx-auto h-12 w-12 text-gray-400">
										<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<h3 class="mt-2 text-sm font-medium text-gray-900">No updates yet</h3>
									<p class="mt-1 text-sm text-gray-500">Updates will appear here when status changes are made.</p>
								</div>
							{:else}
								<div class="space-y-4">
									{#each data.updates as { update, authority }, index}
										<div class="flex items-start space-x-3">
											<div class="flex-shrink-0">
												<div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
													<span class="text-indigo-600 text-sm font-medium">
														{authority?.name?.charAt(0) || 'A'}
													</span>
												</div>
											</div>
											<div class="flex-1 min-w-0">
												<div class="flex items-center justify-between">
													<p class="text-sm font-medium text-gray-900">
														{authority?.name || 'Unknown'}
													</p>
													<p class="text-xs text-gray-500">
														{formatDate(update.createdAt)}
													</p>
												</div>
												{#if update.statusChange}
													<div class="mt-1">
														<Badge class={getStatusColor(update.statusChange)}>
															Status changed to {getStatusText(update.statusChange)}
														</Badge>
													</div>
												{/if}
												{#if update.comment}
													<p class="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
														{update.comment}
													</p>
												{/if}
											</div>
										</div>
										{#if index < data.updates.length - 1}
											<Separator />
										{/if}
									{/each}
								</div>
							{/if}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	</main>
</div>
