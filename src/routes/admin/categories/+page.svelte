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

	let showCreateDialog = false;
	let showEditDialog = false;
	let selectedCategory: any = null;
	let isSubmitting = false;

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatHours(hours: number) {
		if (hours < 24) {
			return `${hours} hours`;
		} else {
			const days = Math.floor(hours / 24);
			const remainingHours = hours % 24;
			if (remainingHours === 0) {
				return `${days} day${days > 1 ? 's' : ''}`;
			} else {
				return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
			}
		}
	}

	function openEditDialog(category: any) {
		selectedCategory = category;
		showEditDialog = true;
	}

	function handleFormSuccess(result: any) {
		if (result.type === 'success') {
			toast.success(result.message || 'Operation completed successfully');
			showCreateDialog = false;
			showEditDialog = false;
			selectedCategory = null;
		}
	}

	function handleFormError(result: any) {
		if (result.type === 'error') {
			toast.error(result.message || 'Operation failed');
		}
	}
</script>

<svelte:head>
	<title>Issue Categories - Admin Dashboard</title>
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
					<h1 class="text-2xl font-bold text-gray-900">Issue Categories</h1>
				</div>
				<div class="flex items-center space-x-4">
					<Dialog bind:open={showCreateDialog}>
						<DialogTrigger>
							<Button>Create Category</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Category</DialogTitle>
								<DialogDescription>
									Create a new issue category with default resolution time.
								</DialogDescription>
							</DialogHeader>
							<form method="POST" action="?/createCategory" use:enhance={handleFormSuccess} onsubmit={() => { isSubmitting = true; }}>
								<div class="space-y-4">
									<div>
										<label for="name" class="block text-sm font-medium text-gray-700">Category Name</label>
										<Input id="name" name="name" placeholder="e.g., Road Maintenance" required />
									</div>
									<div>
										<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
										<Textarea id="description" name="description" placeholder="Brief description of this category..." />
									</div>
									<div>
										<label for="department" class="block text-sm font-medium text-gray-700">Department</label>
										<Input id="department" name="department" placeholder="e.g., Public Works" required />
									</div>
									<div>
										<label for="defaultEstimateHours" class="block text-sm font-medium text-gray-700">Default Resolution Time (hours)</label>
										<Input 
											id="defaultEstimateHours" 
											name="defaultEstimateHours" 
											type="number" 
											min="1" 
											placeholder="72" 
											required 
										/>
										<p class="text-xs text-gray-500 mt-1">Default time estimate for resolving issues in this category</p>
									</div>
								</div>
								<DialogFooter>
									<Button 
										type="button" 
										variant="outline" 
										onclick={() => showCreateDialog = false}
										disabled={isSubmitting}
									>Cancel</Button>
									<Button type="submit" disabled={isSubmitting}>
										{#if isSubmitting}
											<div class="flex items-center">
												<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
												Creating...
											</div>
										{:else}
											Create Category
										{/if}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Filters -->
			<Card class="mb-6">
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<form method="GET" class="flex gap-4 items-end">
						<div class="flex-1">
							<label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
							<Input 
								id="search" 
								name="search" 
								placeholder="Search by name or department..." 
								value={data.filters.search}
							/>
						</div>
						<Button type="submit">Filter</Button>
						{#if data.filters.search}
							<a href="/admin/categories" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Clear</a>
						{/if}
					</form>
				</CardContent>
			</Card>

			<!-- Categories Table -->
			<Card>
				<CardHeader>
					<CardTitle>Categories ({data.pagination.total})</CardTitle>
					<CardDescription>
						Manage issue categories and their default resolution times
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.categories.length === 0}
						<div class="text-center py-12">
							<div class="mx-auto h-12 w-12 text-gray-400">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
								</svg>
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
							<p class="mt-1 text-sm text-gray-500">Create your first issue category to get started.</p>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Time</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authorities</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each data.categories as category}
										<tr>
											<td class="px-6 py-4 whitespace-nowrap">
												<div>
													<div class="text-sm font-medium text-gray-900">{category.name}</div>
													{#if category.description}
														<div class="text-sm text-gray-500">{category.description}</div>
													{/if}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<Badge variant="outline">{category.department}</Badge>
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{formatHours(category.defaultEstimateHours)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{category.issueCount}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{category.authorityCount}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(category.createdAt)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
												<Button 
													variant="outline" 
													size="sm"
													onclick={() => openEditDialog(category)}
												>
													Edit
												</Button>
												<form method="POST" action="?/deleteCategory" use:enhance={handleFormError} class="inline">
													<input type="hidden" name="categoryId" value={category.id} />
													<Button 
														type="submit" 
														variant="destructive" 
														size="sm"
														onclick={(e) => {
															if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
																e.preventDefault();
															}
														}}
													>
														Delete
													</Button>
												</form>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Pagination -->
						{#if data.pagination.totalPages > 1}
							<div class="flex items-center justify-between mt-6">
								<div class="text-sm text-gray-700">
									Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to 
									{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of 
									{data.pagination.total} results
								</div>
								<div class="flex space-x-2">
									{#if data.pagination.page > 1}
										<a 
											href="?page={data.pagination.page - 1}&search={data.filters.search}"
											class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
										>
											Previous
										</a>
									{/if}
									{#if data.pagination.page < data.pagination.totalPages}
										<a 
											href="?page={data.pagination.page + 1}&search={data.filters.search}"
											class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
										>
											Next
										</a>
									{/if}
								</div>
							</div>
						{/if}
					{/if}
				</CardContent>
			</Card>
		</div>
	</main>
</div>

<!-- Edit Category Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Edit Category</DialogTitle>
			<DialogDescription>
				Update category information and default resolution time.
			</DialogDescription>
		</DialogHeader>
		{#if selectedCategory}
			<form method="POST" action="?/updateCategory" use:enhance={handleFormSuccess} onsubmit={() => { isSubmitting = true; }}>
				<input type="hidden" name="categoryId" value={selectedCategory.id} />
				<div class="space-y-4">
					<div>
						<label for="edit-name" class="block text-sm font-medium text-gray-700">Category Name</label>
						<Input id="edit-name" name="name" value={selectedCategory.name} required />
					</div>
					<div>
						<label for="edit-description" class="block text-sm font-medium text-gray-700">Description</label>
						<Textarea id="edit-description" name="description" value={selectedCategory.description || ''} />
					</div>
					<div>
						<label for="edit-department" class="block text-sm font-medium text-gray-700">Department</label>
						<Input id="edit-department" name="department" value={selectedCategory.department} required />
					</div>
					<div>
						<label for="edit-defaultEstimateHours" class="block text-sm font-medium text-gray-700">Default Resolution Time (hours)</label>
						<Input 
							id="edit-defaultEstimateHours" 
							name="defaultEstimateHours" 
							type="number" 
							min="1" 
							value={selectedCategory.defaultEstimateHours} 
							required 
						/>
						<p class="text-xs text-gray-500 mt-1">Default time estimate for resolving issues in this category</p>
					</div>
				</div>
				<DialogFooter>
					<Button 
						type="button" 
						variant="outline" 
						onclick={() => showEditDialog = false}
						disabled={isSubmitting}
					>Cancel</Button>
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							<div class="flex items-center">
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
								Updating...
							</div>
						{:else}
							Update Category
						{/if}
					</Button>
				</DialogFooter>
			</form>
		{/if}
	</DialogContent>
</Dialog>
