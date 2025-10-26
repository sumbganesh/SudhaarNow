<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';

	export let data: PageData;

	let searchQuery = '';
	let statusFilter = 'all';
	let categoryFilter = 'all';
	let sortBy = 'newest';
	let filteredIssues = data.issues;
	let followingIssues = new Set(data.followingIssues?.map(f => f.issueId) || []);


	// Filter and search issues
	$: {
		filteredIssues = data.issues.filter(issue => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (!issue.issue.title.toLowerCase().includes(query) && 
					!issue.issue.description.toLowerCase().includes(query) &&
					!issue.issue.locationAddress.toLowerCase().includes(query)) {
					return false;
				}
			}

			// Status filter
			if (statusFilter !== 'all' && issue.issue.status !== statusFilter) {
				return false;
			}

			// Category filter
			if (categoryFilter !== 'all' && issue.category?.id !== categoryFilter) {
				return false;
			}

			return true;
		});

		// Sort issues
		filteredIssues.sort((a, b) => {
			switch (sortBy) {
				case 'newest':
					return new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime();
				case 'oldest':
					return new Date(a.issue.createdAt).getTime() - new Date(b.issue.createdAt).getTime();
				case 'status':
					return a.issue.status.localeCompare(b.issue.status);
				default:
					return 0;
			}
		});
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'in_progress':
				return 'bg-blue-100 text-blue-800';
			case 'resolved':
				return 'bg-green-100 text-green-800';
			case 'fake':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
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

	function clearFilters() {
		searchQuery = '';
		statusFilter = 'all';
		categoryFilter = 'all';
		sortBy = 'newest';
	}

	async function toggleFollow(issueId: string) {
		try {
			const response = await fetch(`/api/issues/${issueId}/follow`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const result = await response.json();
				if (result.following) {
					followingIssues.add(issueId);
				} else {
					followingIssues.delete(issueId);
				}
				// Update the set to trigger reactivity
				followingIssues = new Set(followingIssues);
			}
		} catch (error) {
			console.error('Error toggling follow:', error);
		}
	}
</script>

<svelte:head>
	<title>My Issues - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<Button variant="ghost" asChild>
						<a href="/citizen">← Back to Dashboard</a>
					</Button>
					<h1 class="text-2xl font-bold text-gray-900 ml-4">My Issues</h1>
				</div>
				<div class="flex items-center space-x-4">
					<Button asChild>
						<a href="/citizen/report">Report New Issue</a>
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Filters and Search -->
			<Card>
				<CardHeader>
					<CardTitle>Filter Issues</CardTitle>
					<CardDescription>Search and filter your reported issues</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<!-- Search -->
						<div>
							<label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
							<Input
								id="search"
								type="text"
								bind:value={searchQuery}
								placeholder="Search issues..."
							/>
						</div>

						<!-- Status Filter -->
						<div>
							<label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
								<Select bind:value={statusFilter}>
									<SelectTrigger>
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="in_progress">In Progress</SelectItem>
									<SelectItem value="resolved">Resolved</SelectItem>
									<SelectItem value="fake">Marked as Fake</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<!-- Category Filter -->
						<div>
							<label for="category" class="block text-sm font-medium text-gray-700 mb-2">Category</label>
								<Select bind:value={categoryFilter}>
									<SelectTrigger>
										<SelectValue placeholder="Filter by category" />
									</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{#each data.categories as category}
										<SelectItem value={category.id}>{category.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<!-- Sort -->
						<div>
							<label for="sort" class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
								<Select bind:value={sortBy}>
									<SelectTrigger>
										<SelectValue placeholder="Choose sorting option" />
									</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">Newest First</SelectItem>
									<SelectItem value="oldest">Oldest First</SelectItem>
									<SelectItem value="status">By Status</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<!-- Filter Actions -->
					<div class="mt-4 flex justify-between items-center">
						<div class="text-sm text-gray-500">
							Showing {filteredIssues.length} of {data.issues.length} issues
						</div>
						<Button variant="ghost" onclick={clearFilters}>
							Clear Filters
						</Button>
					</div>
				</CardContent>
			</Card>

			{#if data.issues.length === 0}
				<div class="text-center py-12">
					<div class="mx-auto h-12 w-12 text-gray-400">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No issues reported</h3>
					<p class="mt-1 text-sm text-gray-500">Get started by reporting your first civic issue.</p>
					<div class="mt-6">
						<Button asChild>
							<a href="/citizen/report">Report Issue</a>
						</Button>
					</div>
				</div>
			{:else if filteredIssues.length === 0}
				<div class="text-center py-12">
					<div class="mx-auto h-12 w-12 text-gray-400">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
					<p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
				</div>
			{:else}
				<div class="bg-white shadow overflow-hidden sm:rounded-md">
					<ul class="divide-y divide-gray-200">
						{#each filteredIssues as { issue, category, assignedAuthority }}
							<li>
								<div class="px-4 py-4 sm:px-6">
									<div class="flex items-center justify-between">
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<p class="text-sm font-medium text-indigo-600 truncate">
													{issue.title}
												</p>
												<div class="ml-2 flex-shrink-0 flex items-center space-x-2">
													<Button
														type="button"
														onclick={() => toggleFollow(issue.id)}
														size="sm"
														variant={followingIssues.has(issue.id) ? "default" : "outline"}
														class="text-xs"
													>
														{#if followingIssues.has(issue.id)}
															<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
																<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
															</svg>
															Following
														{:else}
															<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
															</svg>
															Follow
														{/if}
													</Button>
													<Badge variant="secondary" class={getStatusColor(issue.status)}>
														{getStatusText(issue.status)}
													</Badge>
												</div>
											</div>
											<div class="mt-2">
												<div class="flex items-center text-sm text-gray-500">
													<p class="truncate">{issue.description}</p>
												</div>
											</div>
											<div class="mt-2">
												<div class="flex items-center text-sm text-gray-500">
													<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
													</svg>
													{issue.locationAddress}
												</div>
											</div>
											{#if issue.photos && issue.photos.length > 0}
												<div class="mt-2">
													<div class="flex items-center text-sm text-gray-500 mb-2">
														<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
														</svg>
														{issue.photos.length} photo{issue.photos.length > 1 ? 's' : ''}
													</div>
													<div class="flex space-x-2">
														{#each issue.photos.slice(0, 3) as photo}
															<div class="relative group">
																<div class="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
																	<img 
																		src={photo} 
																		alt="" 
																		class="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
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
																	<div class="hidden w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
																		<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
																		</svg>
																	</div>
																</div>
															</div>
														{/each}
														{#if issue.photos.length > 3}
															<div class="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
																+{issue.photos.length - 3} more
															</div>
														{/if}
													</div>
												</div>
											{/if}
											<div class="mt-2">
												<div class="flex items-center text-sm text-gray-500">
													<span class="font-medium">Category:</span>
													<span class="ml-1">{category?.name} ({category?.department})</span>
												</div>
											</div>
											{#if assignedAuthority}
												<div class="mt-2">
													<div class="flex items-center text-sm text-gray-500">
														<span class="font-medium">Assigned to:</span>
														<span class="ml-1">{assignedAuthority.name}</span>
													</div>
												</div>
											{/if}
										</div>
									</div>
									<div class="mt-2">
										<div class="flex items-center text-sm text-gray-500">
											<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
											</svg>
											Reported on {formatDate(issue.createdAt)}
										</div>
									</div>
									{#if issue.estimatedResolutionDate}
										<div class="mt-1">
											<div class="flex items-center text-sm text-gray-500">
												<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
												</svg>
												Estimated resolution: {formatDate(issue.estimatedResolutionDate)}
											</div>
										</div>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</main>
</div>
