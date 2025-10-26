<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	let showCreateDialog = false;
	let showEditDialog = false;
	let showAssignDialog = false;
	let selectedUser: any = null;
	let selectedCategory = '';
	let isSubmitting = false;
	let isAssigning = false;

	function getRoleColor(role: string) {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'authority':
				return 'bg-blue-100 text-blue-800';
			case 'citizen':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function openEditDialog(user: any) {
		selectedUser = user;
		showEditDialog = true;
	}

	function openAssignDialog(user: any) {
		selectedUser = user;
		showAssignDialog = true;
	}

	function handleFormSuccess(result: any) {
		if (result.type === 'success') {
			toast.success(result.message || 'Operation completed successfully');
			showCreateDialog = false;
			showEditDialog = false;
			showAssignDialog = false;
			selectedUser = null;
			selectedCategory = '';
		}
		isSubmitting = false;
		isAssigning = false;
	}

	function handleFormError(result: any) {
		if (result.type === 'error') {
			toast.error(result.message || 'Operation failed');
		}
		isSubmitting = false;
		isAssigning = false;
	}
</script>

<svelte:head>
	<title>User Management - Admin Dashboard</title>
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
					<h1 class="text-2xl font-bold text-gray-900">User Management</h1>
				</div>
				<div class="flex items-center space-x-4">
					<Dialog bind:open={showCreateDialog}>
						<DialogTrigger>
							<Button>Create User</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New User</DialogTitle>
								<DialogDescription>
									Create a new user account with appropriate role and permissions.
								</DialogDescription>
							</DialogHeader>
							<form method="POST" action="?/createUser" use:enhance={handleFormSuccess} onsubmit={() => { isSubmitting = true; }}>
								<div class="space-y-4">
									<div>
										<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
										<Input id="name" name="name" required />
									</div>
									<div>
										<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
										<Input id="email" name="email" type="email" required />
									</div>
									<div>
										<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
										<Input id="password" name="password" type="password" required />
									</div>
									<div>
										<label for="role" class="block text-sm font-medium text-gray-700">Role</label>
										<Select name="role" type="single" required>
											<SelectTrigger>
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="citizen">Citizen</SelectItem>
												<SelectItem value="authority">Authority</SelectItem>
												<SelectItem value="admin">Admin</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<label for="phone" class="block text-sm font-medium text-gray-700">Phone (Optional)</label>
										<Input id="phone" name="phone" type="tel" />
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
											Create User
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
								placeholder="Search by name or email..." 
								value={data.filters.search}
							/>
						</div>
						<div>
							<label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
							<Select name="role" type="single" value={data.filters.role}>
								<SelectTrigger class="w-40">
									<SelectValue placeholder="All roles" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All roles</SelectItem>
									<SelectItem value="citizen">Citizen</SelectItem>
									<SelectItem value="authority">Authority</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button type="submit">Filter</Button>
						{#if data.filters.search || data.filters.role}
							<a href="/admin/users" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Clear</a>
						{/if}
					</form>
				</CardContent>
			</Card>

			<!-- Users Table -->
			<Card>
				<CardHeader>
					<CardTitle>Users ({data.pagination.total})</CardTitle>
					<CardDescription>
						Manage user accounts, roles, and authority assignments
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.users.length === 0}
						<div class="text-center py-12">
							<div class="mx-auto h-12 w-12 text-gray-400">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
								</svg>
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
							<p class="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each data.users as user}
										<tr>
											<td class="px-6 py-4 whitespace-nowrap">
												<div>
													<div class="text-sm font-medium text-gray-900">{user.name}</div>
													<div class="text-sm text-gray-500">{user.email}</div>
													{#if user.phone}
														<div class="text-sm text-gray-500">{user.phone}</div>
													{/if}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<Badge class={getRoleColor(user.role)}>
													{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
												</Badge>
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{user.points}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{user.issueCount}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(user.createdAt)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
												<Button 
													variant="outline" 
													size="sm"
													onclick={() => openEditDialog(user)}
												>
													Edit
												</Button>
												{#if user.role === 'authority'}
													<Button 
														variant="outline" 
														size="sm"
														onclick={() => openAssignDialog(user)}
													>
														Categories
													</Button>
												{/if}
												<form method="POST" action="?/deleteUser" use:enhance={handleFormError} class="inline">
													<input type="hidden" name="userId" value={user.id} />
													<Button 
														type="submit" 
														variant="destructive" 
														size="sm"
														onclick={(e) => {
															if (!confirm('Are you sure you want to delete this user?')) {
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
											href="?page={data.pagination.page - 1}&search={data.filters.search}&role={data.filters.role}"
											class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
										>
											Previous
										</a>
									{/if}
									{#if data.pagination.page < data.pagination.totalPages}
										<a 
											href="?page={data.pagination.page + 1}&search={data.filters.search}&role={data.filters.role}"
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

<!-- Edit User Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Edit User</DialogTitle>
			<DialogDescription>
				Update user information and role.
			</DialogDescription>
		</DialogHeader>
		{#if selectedUser}
			<form method="POST" action="?/updateUser" use:enhance={handleFormSuccess} onsubmit={() => { isSubmitting = true; }}>
				<input type="hidden" name="userId" value={selectedUser.id} />
				<div class="space-y-4">
					<div>
						<label for="edit-name" class="block text-sm font-medium text-gray-700">Name</label>
						<Input id="edit-name" name="name" value={selectedUser.name} required />
					</div>
					<div>
						<label for="edit-email" class="block text-sm font-medium text-gray-700">Email</label>
						<Input id="edit-email" name="email" type="email" value={selectedUser.email} required />
					</div>
					<div>
						<label for="edit-role" class="block text-sm font-medium text-gray-700">Role</label>
						<Select name="role" type="single" value={selectedUser.role} required>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="citizen">Citizen</SelectItem>
								<SelectItem value="authority">Authority</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label for="edit-phone" class="block text-sm font-medium text-gray-700">Phone</label>
						<Input id="edit-phone" name="phone" type="tel" value={selectedUser.phone || ''} />
					</div>
					<div>
						<label for="edit-points" class="block text-sm font-medium text-gray-700">Points</label>
						<Input id="edit-points" name="points" type="number" value={selectedUser.points} />
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
							Update User
						{/if}
					</Button>
				</DialogFooter>
			</form>
		{/if}
	</DialogContent>
</Dialog>

<!-- Assign Authority Dialog -->
<Dialog bind:open={showAssignDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Manage Authority Categories</DialogTitle>
			<DialogDescription>
				Assign or remove authority categories for this user.
			</DialogDescription>
		</DialogHeader>
		{#if selectedUser}
			<div class="space-y-4">
				<!-- Current Assignments -->
				<div>
					<h4 class="text-sm font-medium text-gray-900 mb-2">Current Categories</h4>
					{#if data.authorities.filter(a => a.user?.id === selectedUser.id).length === 0}
						<p class="text-sm text-gray-500">No categories assigned</p>
					{:else}
						<div class="space-y-2">
							{#each data.authorities.filter(a => a.user?.id === selectedUser.id) as authority}
								<div class="flex items-center justify-between p-2 bg-gray-50 rounded">
									<span class="text-sm">{authority.category?.name} ({authority.category?.department})</span>
									<form method="POST" action="?/removeAuthority" use:enhance={handleFormError} class="inline">
										<input type="hidden" name="authorityId" value={authority.authority.id} />
										<Button type="submit" variant="destructive" size="sm">Remove</Button>
									</form>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Add New Assignment -->
				<div>
					<h4 class="text-sm font-medium text-gray-900 mb-2">Assign New Category</h4>
					<form method="POST" action="?/assignAuthority" use:enhance={() => {
						isAssigning = true;
						return async ({ update, result }) => {
							await update();
							if (result.type === 'success') {
								handleFormSuccess(result);
							} else if (result.type === 'error') {
								handleFormError(result);
							}
						};
					}}>
						<input type="hidden" name="userId" value={selectedUser.id} />
						<div class="flex gap-2">
							<Select name="categoryId" type="single" bind:value={selectedCategory} required disabled={isAssigning}>
								<SelectTrigger class="flex-1">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{#each data.categories.filter(cat => 
										!data.authorities.some(a => 
											a.user?.id === selectedUser.id && a.category?.id === cat.id
										)
									) as category}
										<SelectItem value={category.id}>
											{category.name} ({category.department})
										</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							<Button type="submit" disabled={isAssigning || !selectedCategory}>
								{#if isAssigning}
									<div class="flex items-center">
										<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										Assigning...
									</div>
								{:else}
									Assign
								{/if}
							</Button>
						</div>
					</form>
				</div>
			</div>
			<DialogFooter>
				<Button 
					type="button" 
					variant="outline" 
					onclick={() => showAssignDialog = false}
					disabled={isAssigning}
				>Close</Button>
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>
