<script lang="ts">
	import type { PageData } from './$types';
	import GoogleMap from '$lib/components/GoogleMap.svelte';

	export let data: PageData;

	let activeTab = 'pending';
	let mapMarkers: Array<{ lat: number; lng: number; title: string; info: string }> = [];

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

	function getFilteredIssues() {
		switch (activeTab) {
			case 'pending':
				return data.issues.filter(i => i.issue.status === 'pending');
			case 'in_progress':
				return data.issues.filter(i => i.issue.status === 'in_progress');
			case 'resolved':
				return data.issues.filter(i => i.issue.status === 'resolved');
			case 'map':
				return data.issues; // For map view, show all issues
			default:
				return data.issues;
		}
	}

	function calculateResolutionTime(issue: { issue: any; }) {
		if (issue.issue.status === 'resolved' && issue.issue.actualResolutionDate) {
			const created = new Date(issue.issue.createdAt);
			const resolved = new Date(issue.issue.actualResolutionDate);
			const diffTime = Math.abs(resolved.getTime() - created.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays;
		}
		return null;
	}

	function createMapMarkers() {
		const filteredIssues = getFilteredIssues();
		mapMarkers = filteredIssues.map(issue => ({
			lat: issue.issue.locationLat,
			lng: issue.issue.locationLng,
			title: issue.issue.title,
			info: `
				<div class="p-2">
					<h3 class="font-semibold text-sm mb-1">${issue.issue.title}</h3>
					<p class="text-xs text-gray-600 mb-2">${issue.issue.description.substring(0, 100)}${issue.issue.description.length > 100 ? '...' : ''}</p>
					<div class="flex items-center justify-between text-xs">
						<span class="px-2 py-1 rounded ${getStatusColor(issue.issue.status)}">${getStatusText(issue.issue.status)}</span>
						<span class="text-gray-500">${issue.category?.name || 'Unknown Category'}</span>
					</div>
					<div class="mt-2 text-xs text-gray-500">
						<p>Posted by: ${issue.postedBy?.name || 'Unknown'}</p>
						<p>Location: ${issue.issue.locationAddress}</p>
						<p>Date: ${formatDate(issue.issue.createdAt)}</p>
					</div>
				</div>
			`
		}));
	}

	// Reactive statement to update map markers when activeTab changes
	$: if (activeTab === 'map') {
		createMapMarkers();
	}
</script>

<svelte:head>
	<title>Public Wall - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900">SudhaarNow - Public Wall</h1>
				</div>
				<div class="flex items-center space-x-4">
					<a
						href="/login"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Login
					</a>
					<a
						href="/signup"
						class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Sign Up
					</a>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">📝</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Issues</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.total}</dd>
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
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">⏳</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Pending</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.pending}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white overflow-hidden shadow rounded-lg">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">🔄</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">In Progress</dt>
									<dd class="text-lg font-medium text-gray-900">{data.stats.inProgress}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Issues List -->
				<div class="lg:col-span-2">
					<div class="bg-white shadow rounded-lg">
						<div class="px-4 py-5 sm:px-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">Community Issues</h3>
							<p class="mt-1 max-w-2xl text-sm text-gray-500">
								Track civic issues and their resolution progress
							</p>
						</div>

						<!-- Tabs -->
						<div class="border-b border-gray-200">
							<nav class="-mb-px flex space-x-8 px-4" aria-label="Tabs">
								<button
									class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'pending' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
									on:click={() => activeTab = 'pending'}
								>
									Pending Issues
								</button>
								<button
									class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'in_progress' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
									on:click={() => activeTab = 'in_progress'}
								>
									Issues in Progress
								</button>
								<button
									class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'resolved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
									on:click={() => activeTab = 'resolved'}
								>
									Resolved Issues
								</button>
								<button
									class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'map' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
									on:click={() => activeTab = 'map'}
								>
									Map View
								</button>
							</nav>
						</div>

						<!-- Content based on active tab -->
						{#if activeTab === 'map'}
							<!-- Map View -->
							<div class="p-4">
								<div class="mb-4">
									<h4 class="text-sm font-medium text-gray-900 mb-2">Issues Map</h4>
									<p class="text-sm text-gray-500">Click on markers to view issue details</p>
									{#if mapMarkers.length === 0}
										<p class="text-sm text-yellow-600 mt-2">No issues found for the current filter</p>
									{/if}
								</div>
								{#if mapMarkers.length > 0}
									<div class="h-96 rounded-lg overflow-hidden border">
										<GoogleMap
											apiKey={data.googleMapsApiKey}
											center={{ lat: 40.7128, lng: -74.0060 }}
											zoom={10}
											height="100%"
											width="100%"
											enableSearch={false}
											enableClickToSelect={false}
											markers={mapMarkers}
										/>
									</div>
								{:else}
									<div class="h-96 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
										<div class="text-center">
											<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
											</svg>
											<h3 class="mt-2 text-sm font-medium text-gray-900">No issues to display</h3>
											<p class="mt-1 text-sm text-gray-500">Try switching to a different tab to see issues.</p>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<!-- Issues List -->
							<div class="divide-y divide-gray-200">
								{#each getFilteredIssues() as { issue, category, postedBy, assignedTo }}
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
																<img 
																	src={photo} 
																	alt="" 
																	class="w-16 h-16 object-cover rounded border"
																/>
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
												<div class="mt-2">
													<div class="flex items-center text-sm text-gray-500">
														<span class="font-medium">Reported by:</span>
														<span class="ml-1">{postedBy?.name}</span>
													</div>
												</div>
												{#if assignedTo}
													<div class="mt-2">
														<div class="flex items-center text-sm text-gray-500">
															<span class="font-medium">Assigned to:</span>
															<span class="ml-1">{assignedTo.name}</span>
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
										{#if issue.status === 'resolved' && issue.actualResolutionDate}
											<div class="mt-1">
												<div class="flex items-center text-sm text-gray-500">
													<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
													</svg>
													Resolved on {formatDate(issue.actualResolutionDate)}
													{#if calculateResolutionTime({ issue })}
														<span class="ml-2 text-green-600 font-medium">
															({calculateResolutionTime({ issue })} days)
														</span>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								{/each}
								{#if getFilteredIssues().length === 0}
									<div class="px-4 py-8 sm:px-6 text-center">
										<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										<h3 class="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
										<p class="mt-1 text-sm text-gray-500">No issues match the current filter. Try switching to a different tab.</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Achievement Board -->
				<div class="lg:col-span-1">
					<div class="bg-white shadow rounded-lg">
						<div class="px-4 py-5 sm:px-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">Top Citizens</h3>
							<p class="mt-1 max-w-2xl text-sm text-gray-500">
								Most active community members
							</p>
						</div>
						<div class="divide-y divide-gray-200">
							{#each data.topCitizens as citizen, index}
								<div class="px-4 py-4 sm:px-6">
									<div class="flex items-center">
										<div class="flex-shrink-0">
											<div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
												<span class="text-white text-sm font-medium">
													{index + 1}
												</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{citizen.name}</div>
											<div class="text-sm text-gray-500">{citizen.points} points</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
