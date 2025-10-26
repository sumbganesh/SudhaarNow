<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import AuthorityMetrics from '$lib/components/AuthorityMetrics.svelte';
	import BulkActions from '$lib/components/BulkActions.svelte';
	import ExportDialog from '$lib/components/ExportDialog.svelte';
	import GoogleMap from '$lib/components/GoogleMap.svelte';

	export let data: PageData;

	// Google Maps API Key
	const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key_here';

	// Filter and search state
	let searchTerm = '';
	let statusFilter = 'all';
	let categoryFilter = 'all';
	let sortBy = 'newest';

	// Bulk actions state
	let selectedIssues: string[] = [];

	// Form submission state
	let isSubmitting = false;
	let submitError = '';
	let submitSuccess = '';

	// Computed filtered issues
	$: filteredIssues = data.issues.filter(issue => {
		const matchesSearch = issue.issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			issue.issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			issue.issue.locationAddress.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesStatus = statusFilter === 'all' || issue.issue.status === statusFilter;
		const matchesCategory = categoryFilter === 'all' || issue.category?.id === categoryFilter;
		
		return matchesSearch && matchesStatus && matchesCategory;
	});

	// Computed sorted issues
	$: sortedIssues = [...filteredIssues].sort((a, b) => {
		switch (sortBy) {
			case 'newest':
				return new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime();
			case 'oldest':
				return new Date(a.issue.createdAt).getTime() - new Date(b.issue.createdAt).getTime();
			case 'status':
				return a.issue.status.localeCompare(b.issue.status);
			case 'title':
				return a.issue.title.localeCompare(b.issue.title);
			default:
				return 0;
		}
	});

	// Computed map markers for issues
	$: mapMarkers = filteredIssues.map(issue => ({
		lat: issue.issue.locationLat,
		lng: issue.issue.locationLng,
		title: issue.issue.title,
		info: `
			<div class="p-2">
				<h3 class="font-semibold text-sm">${issue.issue.title}</h3>
				<p class="text-xs text-gray-600 mt-1">${issue.issue.description.substring(0, 100)}...</p>
				<div class="mt-2">
					<span class="inline-block px-2 py-1 text-xs rounded-full ${issue.issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : issue.issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : issue.issue.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
						${getStatusText(issue.issue.status).toUpperCase()}
					</span>
				</div>
				<div class="mt-1">
					<a href="/authority/issues/${issue.issue.id}" class="text-blue-600 text-xs hover:underline">View Details</a>
				</div>
			</div>
		`
	}));

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

	function handleFormSubmit(event: SubmitEvent) {
		isSubmitting = true;
		submitError = '';
		submitSuccess = '';
	}
</script>

<svelte:head>
	<title>Authority Dashboard - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900">Authority Dashboard</h1>
				</div>
				<div class="flex items-center space-x-4">
					<ExportDialog issues={sortedIssues} />
					<div class="text-sm text-gray-700">
						Welcome, {data.user.name}
					</div>
					<form method="POST" action="/logout">
						<Button type="submit" variant="outline" size="sm">
							Logout
						</Button>
					</form>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Performance Metrics -->
			<AuthorityMetrics metrics={data.metrics} />

			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">⏳</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Pending</dt>
									<dd class="text-lg font-medium text-gray-900">
										{data.issues.filter(i => i.issue.status === 'pending').length}
									</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">🔄</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">In Progress</dt>
									<dd class="text-lg font-medium text-gray-900">
										{data.issues.filter(i => i.issue.status === 'in_progress').length}
									</dd>
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
									<span class="text-white text-sm font-medium">✅</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Resolved</dt>
									<dd class="text-lg font-medium text-gray-900">
										{data.issues.filter(i => i.issue.status === 'resolved').length}
									</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">❌</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Fake</dt>
									<dd class="text-lg font-medium text-gray-900">
										{data.issues.filter(i => i.issue.status === 'fake').length}
									</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Issues Map -->
			{#if mapMarkers.length > 0}
				<Card class="mb-6">
					<CardHeader>
						<CardTitle>Issues Map</CardTitle>
						<CardDescription>View all issues on an interactive map</CardDescription>
					</CardHeader>
					<CardContent>
						<GoogleMap
							apiKey={GOOGLE_MAPS_API_KEY}
							center={{ lat: 40.7128, lng: -74.0060 }}
							zoom={10}
							height="500px"
							enableSearch={false}
							enableClickToSelect={false}
							markers={mapMarkers}
							onLocationSelect={undefined}
						/>
					</CardContent>
				</Card>
			{/if}

			<!-- Filters and Search -->
			<Card class="mb-6">
				<CardHeader>
					<CardTitle>Filter & Search Issues</CardTitle>
					<CardDescription>Use the filters below to find specific issues</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
							<Input
								id="search"
								bind:value={searchTerm}
								placeholder="Search issues..."
								class="w-full"
							/>
						</div>
						<div>
							<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
							<select bind:value={statusFilter} class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
								<option value="all">All Statuses</option>
								<option value="pending">Pending</option>
								<option value="in_progress">In Progress</option>
								<option value="resolved">Resolved</option>
								<option value="fake">Fake</option>
							</select>
						</div>
						<div>
							<label for="category-filter" class="block text-sm font-medium text-gray-700 mb-2">Category</label>
							<select bind:value={categoryFilter} class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
								<option value="all">All Categories</option>
								{#each data.issues.map(i => i.category).filter(Boolean) as category}
									{#if category}
										<option value={category.id}>{category.name}</option>
									{/if}
								{/each}
							</select>
						</div>
						<div>
							<label for="sort" class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
							<select bind:value={sortBy} class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
								<option value="status">Status</option>
								<option value="title">Title</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Bulk Actions -->
			<BulkActions 
				{selectedIssues} 
				allIssues={sortedIssues}
				onSelectionChange={(issues) => selectedIssues = issues}
			/>

			<!-- Issues Table -->
			<Card>
				<CardHeader>
					<CardTitle>Assigned Issues ({sortedIssues.length})</CardTitle>
					<CardDescription>Issues assigned to your categories</CardDescription>
				</CardHeader>
				<CardContent>
					{#if sortedIssues.length === 0}
						<div class="text-center py-12">
							<div class="mx-auto h-12 w-12 text-gray-400">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
							<p class="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
						</div>
					{:else}
						<!-- Mobile Card View -->
						<div class="block md:hidden space-y-4">
							{#each sortedIssues as { issue, category, postedBy }}
								<Card>
									<CardContent class="p-4">
										<div class="flex items-start justify-between mb-3">
											<div class="flex-1 min-w-0">
												<h3 class="font-medium text-gray-900 truncate">{issue.title}</h3>
												<p class="text-sm text-gray-500 truncate mt-1">{issue.description}</p>
											</div>
											<div class="ml-2 flex-shrink-0">
												<Badge class={getStatusColor(issue.status)}>
													{getStatusText(issue.status)}
												</Badge>
											</div>
										</div>
										
										<div class="space-y-2 text-sm">
											<div class="flex justify-between">
												<span class="text-gray-500">Priority:</span>
												<span class={getPriorityColor(issue.createdAt)}>
													{getPriorityText(issue.createdAt)}
												</span>
											</div>
											<div class="flex justify-between">
												<span class="text-gray-500">Category:</span>
												<span class="text-gray-900">{category?.name}</span>
											</div>
											<div class="flex justify-between">
												<span class="text-gray-500">Location:</span>
												<span class="text-gray-900 truncate ml-2">{issue.locationAddress}</span>
											</div>
											<div class="flex justify-between">
												<span class="text-gray-500">Reported by:</span>
												<span class="text-gray-900">{postedBy?.name}</span>
											</div>
											<div class="flex justify-between">
												<span class="text-gray-500">Date:</span>
												<span class="text-gray-900">{formatDate(issue.createdAt)}</span>
											</div>
										</div>
										
										<div class="flex space-x-2 mt-4">
											<Button size="sm" variant="outline" href="/authority/issues/{issue.id}" class="flex-1">
												View Details
											</Button>
											{#if issue.status === 'pending'}
												<Dialog>
													<DialogTrigger class="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 gap-1.5 rounded-md px-3">
														Quick Update
													</DialogTrigger>
													<DialogContent>
														<DialogHeader>
															<DialogTitle>Quick Status Update</DialogTitle>
															<DialogDescription>
																Update the status of "{issue.title}"
															</DialogDescription>
														</DialogHeader>
														<form method="POST" action="/authority/issues/{issue.id}?/updateStatus" use:enhance>
															<div class="space-y-4">
																{#if submitError}
																	<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
																		{submitError}
																	</div>
																{/if}
																{#if submitSuccess}
																	<div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
																		{submitSuccess}
																	</div>
																{/if}
																<div>
																	<label for="mobile-status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
																	<select name="status" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
																		<option value="">Choose new status</option>
																		<option value="in_progress">In Progress</option>
																		<option value="resolved">Resolved</option>
																		<option value="fake">Mark as Fake</option>
																	</select>
																</div>
																<div>
																	<label for="mobile-comment" class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
																	<Textarea
																		name="comment"
																		placeholder="Add a comment..."
																		rows={3}
																	/>
																</div>
																<div class="flex justify-end space-x-2">
																	<Button type="button" variant="outline">Cancel</Button>
																	<Button type="submit" disabled={isSubmitting}>
																		{isSubmitting ? 'Updating...' : 'Update Status'}
																	</Button>
																</div>
															</div>
														</form>
													</DialogContent>
												</Dialog>
											{/if}
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>

						<!-- Desktop Table View -->
						<div class="hidden md:block overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead class="w-12">
											<input 
												type="checkbox" 
												class="rounded border-gray-300"
												checked={selectedIssues.length === sortedIssues.length && sortedIssues.length > 0}
												onchange={() => {
													if (selectedIssues.length === sortedIssues.length) {
														selectedIssues = [];
													} else {
														selectedIssues = sortedIssues.map(i => i.issue.id);
													}
												}}
											/>
										</TableHead>
										<TableHead>Issue</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Location</TableHead>
										<TableHead>Reported By</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each sortedIssues as { issue, category, postedBy }}
										<TableRow>
											<TableCell>
												<input 
													type="checkbox" 
													class="rounded border-gray-300"
													checked={selectedIssues.includes(issue.id)}
													onchange={() => {
														if (selectedIssues.includes(issue.id)) {
															selectedIssues = selectedIssues.filter(id => id !== issue.id);
														} else {
															selectedIssues = [...selectedIssues, issue.id];
														}
													}}
												/>
											</TableCell>
											<TableCell>
												<div class="max-w-xs">
													<div class="font-medium text-gray-900 truncate">{issue.title}</div>
													<div class="text-sm text-gray-500 truncate">{issue.description}</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge class={getStatusColor(issue.status)}>
													{getStatusText(issue.status)}
												</Badge>
											</TableCell>
											<TableCell>
												<span class={getPriorityColor(issue.createdAt)}>
													{getPriorityText(issue.createdAt)}
												</span>
											</TableCell>
											<TableCell>
												<div class="text-sm">
													<div class="font-medium">{category?.name}</div>
													<div class="text-gray-500">{category?.department}</div>
												</div>
											</TableCell>
											<TableCell>
												<div class="max-w-xs text-sm text-gray-600 truncate">
													{issue.locationAddress}
												</div>
											</TableCell>
											<TableCell>
												<div class="text-sm">
													<div class="font-medium">{postedBy?.name}</div>
													<div class="text-gray-500">{postedBy?.email}</div>
												</div>
											</TableCell>
											<TableCell>
												<div class="text-sm text-gray-600">
													{formatDate(issue.createdAt)}
												</div>
											</TableCell>
											<TableCell>
												<div class="flex space-x-2">
													<Button size="sm" variant="outline" href="/authority/issues/{issue.id}">
														View
													</Button>
													{#if issue.status === 'pending'}
														<Dialog>
															<DialogTrigger class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 gap-1.5 rounded-md px-3">
																Quick Update
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>Quick Status Update</DialogTitle>
																	<DialogDescription>
																		Update the status of "{issue.title}"
																	</DialogDescription>
																</DialogHeader>
																<form method="POST" action="/authority/issues/{issue.id}?/updateStatus" use:enhance>
																	<div class="space-y-4">
																		{#if submitError}
																			<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
																				{submitError}
																			</div>
																		{/if}
																		{#if submitSuccess}
																			<div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
																				{submitSuccess}
																			</div>
																		{/if}
																		<div>
																			<label for="quick-status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
																			<select name="status" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
																				<option value="">Choose new status</option>
																				<option value="in_progress">In Progress</option>
																				<option value="resolved">Resolved</option>
																				<option value="fake">Mark as Fake</option>
																			</select>
																		</div>
																		<div>
																			<label for="quick-comment" class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
																			<Textarea
																				name="comment"
																				placeholder="Add a comment..."
																				rows={3}
																			/>
																		</div>
																		<div class="flex justify-end space-x-2">
																			<Button type="button" variant="outline">Cancel</Button>
																			<Button type="submit" disabled={isSubmitting}>
																				{isSubmitting ? 'Updating...' : 'Update Status'}
																			</Button>
																		</div>
																	</div>
																</form>
															</DialogContent>
														</Dialog>
													{/if}
												</div>
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</main>
</div>
