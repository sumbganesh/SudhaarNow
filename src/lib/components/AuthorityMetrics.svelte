<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let metrics: {
		totalIssues: number;
		resolvedIssues: number;
		pendingIssues: number;
		inProgressIssues: number;
		fakeIssues: number;
		averageResolutionTime: number;
		responseTime: number;
		assignedCategories: Array<{
			name: string;
			department: string;
			issueCount: number;
		}>;
	};

	function formatTime(hours: number): string {
		if (hours < 24) {
			return `${Math.round(hours)}h`;
		} else {
			const days = Math.round(hours / 24);
			return `${days}d`;
		}
	}

	function getResolutionRate(): number {
		if (metrics.totalIssues === 0) return 0;
		return Math.round((metrics.resolvedIssues / metrics.totalIssues) * 100);
	}

	function getResponseRate(): string {
		if (metrics.responseTime < 24) {
			return 'Excellent';
		} else if (metrics.responseTime < 72) {
			return 'Good';
		} else {
			return 'Needs Improvement';
		}
	}

	function getResponseColor(): string {
		if (metrics.responseTime < 24) {
			return 'text-green-600';
		} else if (metrics.responseTime < 72) {
			return 'text-yellow-600';
		} else {
			return 'text-red-600';
		}
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
	<!-- Resolution Rate -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Resolution Rate</CardTitle>
			<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{getResolutionRate()}%</div>
			<p class="text-xs text-muted-foreground">
				{metrics.resolvedIssues} of {metrics.totalIssues} issues resolved
			</p>
		</CardContent>
	</Card>

	<!-- Average Resolution Time -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Avg Resolution Time</CardTitle>
			<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{formatTime(metrics.averageResolutionTime)}</div>
			<p class="text-xs text-muted-foreground">
				Average time to resolve issues
			</p>
		</CardContent>
	</Card>

	<!-- Response Time -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Response Time</CardTitle>
			<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{formatTime(metrics.responseTime)}</div>
			<p class="text-xs text-muted-foreground">
				<span class={getResponseColor()}>{getResponseRate()}</span> response time
			</p>
		</CardContent>
	</Card>

	<!-- Active Issues -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Active Issues</CardTitle>
			<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{metrics.pendingIssues + metrics.inProgressIssues}</div>
			<p class="text-xs text-muted-foreground">
				{metrics.pendingIssues} pending, {metrics.inProgressIssues} in progress
			</p>
		</CardContent>
	</Card>
</div>

<!-- Category Breakdown -->
<Card class="mb-6">
	<CardHeader>
		<CardTitle>Issues by Category</CardTitle>
		<CardDescription>Distribution of issues across your assigned categories</CardDescription>
	</CardHeader>
	<CardContent>
		{#if metrics.assignedCategories.length === 0}
			<div class="text-center py-8">
				<p class="text-sm text-gray-500">No categories assigned yet</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each metrics.assignedCategories as category}
					<div class="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<h4 class="font-medium">{category.name}</h4>
							<p class="text-sm text-gray-500">{category.department}</p>
						</div>
						<Badge variant="secondary">
							{category.issueCount} issues
						</Badge>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
