<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

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
</script>

<svelte:head>
	<title>Admin Dashboard - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
				</div>
				<div class="flex items-center space-x-4">
					<div class="text-sm text-gray-700">
						Welcome, {data.user.name}
					</div>
					<form method="POST" action="/logout">
						<button type="submit" class="text-sm text-gray-500 hover:text-gray-700">
							Logout
						</button>
					</form>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
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
									<dd class="text-xs text-gray-500">{data.stats.citizens} citizens, {data.stats.admins} admins, {data.stats.authorityUsers} authorities</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
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
									<dd class="text-xs text-gray-500">{data.stats.resolved} resolved ({data.stats.resolutionRate}%)</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">📂</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Categories</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.categories}</dd>
									<dd class="text-xs text-gray-500">{data.stats.authorities} authorities</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">📊</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Status Breakdown</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.pending} pending</dd>
									<dd class="text-xs text-gray-500">{data.stats.inProgress} in progress, {data.stats.fake} fake</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Management Actions -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div class="bg-white shadow rounded-lg p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">User Management</h3>
					<p class="text-sm text-gray-600 mb-4">
						Manage users, create authority accounts, and assign roles.
					</p>
					<a 
						href="/admin/users" 
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Manage Users
					</a>
				</div>

				<div class="bg-white shadow rounded-lg p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Issue Categories</h3>
					<p class="text-sm text-gray-600 mb-4">
						Create and manage issue categories with default resolution times.
					</p>
					<a 
						href="/admin/categories" 
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
					>
						Manage Categories
					</a>
				</div>

				<div class="bg-white shadow rounded-lg p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
					<p class="text-sm text-gray-600 mb-4">
						Configure badges, points system, and platform settings.
					</p>
					<a 
						href="/admin/settings" 
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
					>
						Settings
					</a>
				</div>
			</div>

			<!-- Analytics Section -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				<!-- Issues by Category -->
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:px-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900">Issues by Category</h3>
						<p class="mt-1 max-w-2xl text-sm text-gray-500">
							Distribution of issues across different categories
						</p>
					</div>
					<div class="px-4 pb-5 sm:px-6">
						{#if data.issuesByCategory.length === 0}
							<div class="text-center py-8">
								<p class="text-sm text-gray-500">No issues reported yet</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each data.issuesByCategory as { category, count }}
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="text-sm font-medium text-gray-900">{category.name}</div>
											<div class="text-xs text-gray-500">{category.department}</div>
										</div>
										<div class="flex items-center space-x-2">
											<div class="w-20 bg-gray-200 rounded-full h-2">
												<div 
													class="bg-blue-500 h-2 rounded-full" 
													style="width: {data.stats.issues > 0 ? (count / data.stats.issues) * 100 : 0}%"
												></div>
											</div>
											<span class="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Top Contributors -->
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:px-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900">Top Contributors</h3>
						<p class="mt-1 max-w-2xl text-sm text-gray-500">
							Citizens with the highest points and most issues reported
						</p>
					</div>
					<div class="px-4 pb-5 sm:px-6">
						{#if data.topContributors.length === 0}
							<div class="text-center py-8">
								<p class="text-sm text-gray-500">No contributors yet</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each data.topContributors as contributor, index}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div class="flex items-center space-x-3">
											<div class="flex-shrink-0">
												<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
													<span class="text-white text-sm font-medium">{index + 1}</span>
												</div>
											</div>
											<div>
												<div class="text-sm font-medium text-gray-900">{contributor.name}</div>
												<div class="text-xs text-gray-500">{contributor.issueCount} issues reported</div>
											</div>
										</div>
										<div class="text-right">
											<div class="text-sm font-medium text-gray-900">{contributor.points} pts</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Recent Issues -->
			<div class="bg-white shadow overflow-hidden sm:rounded-md">
				<div class="px-4 py-5 sm:px-6">
					<h3 class="text-lg leading-6 font-medium text-gray-900">Recent Issues</h3>
					<p class="mt-1 max-w-2xl text-sm text-gray-500">
						Latest issues reported on the platform
					</p>
				</div>
				
				{#if data.recentIssues.length === 0}
					<div class="text-center py-12">
						<div class="mx-auto h-12 w-12 text-gray-400">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No issues yet</h3>
						<p class="mt-1 text-sm text-gray-500">Issues will appear here as citizens report them.</p>
					</div>
				{:else}
					<ul class="divide-y divide-gray-200">
						{#each data.recentIssues as { issue, category, postedBy }}
							<li>
								<div class="px-4 py-4 sm:px-6">
									<div class="flex items-center justify-between">
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<p class="text-sm font-medium text-indigo-600 truncate">
													{issue.title}
												</p>
												<div class="ml-2 flex-shrink-0 flex">
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(issue.status)}">
														{getStatusText(issue.status)}
													</span>
												</div>
											</div>
											<div class="mt-2">
												<div class="flex items-center text-sm text-gray-500">
													<p class="truncate">{issue.description}</p>
												</div>
											</div>
											<div class="mt-2">
												<div class="flex items-center text-sm text-gray-500">
													<span class="font-medium">Category:</span>
													<span class="ml-1">{category?.name} ({category?.department})</span>
												</div>
											</div>
											<div class="mt-2">
												<div class="flex items-center text-sm text-gray-500">
													<span class="font-medium">Reported by:</span>
													<span class="ml-1">{postedBy?.name}</span>
												</div>
											</div>
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
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</main>
</div>
