<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { leaderboard = [], currentUser }: {
		leaderboard?: { id: string; name: string; points: number }[];
		currentUser: { id: string; name: string; points: number };
	} = $props();

	function getRankIcon(rank: number) {
		switch (rank) {
			case 1:
				return '🥇';
			case 2:
				return '🥈';
			case 3:
				return '🥉';
			default:
				return `#${rank}`;
		}
	}

	function getRankColor(rank: number) {
		switch (rank) {
			case 1:
				return 'text-yellow-600';
			case 2:
				return 'text-gray-600';
			case 3:
				return 'text-orange-600';
			default:
				return 'text-gray-500';
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>🏆 Leaderboard</CardTitle>
	</CardHeader>
	<CardContent>
		{#if leaderboard.length === 0}
			<div class="text-center py-4">
				<p class="text-sm text-gray-500">No data available</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each leaderboard.slice(0, 10) as user, index}
					{@const rank = index + 1}
					{@const isCurrentUser = user.id === currentUser.id}
					<div class="flex items-center justify-between p-3 rounded-lg {isCurrentUser ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}">
						<div class="flex items-center space-x-3">
							<div class="flex-shrink-0">
								<span class="text-lg font-bold {getRankColor(rank)}">
									{getRankIcon(rank)}
								</span>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 truncate {isCurrentUser ? 'text-indigo-900' : ''}">
									{user.name}
									{#if isCurrentUser}
										<span class="ml-1 text-xs text-indigo-600">(You)</span>
									{/if}
								</p>
								<p class="text-xs text-gray-500">
									{user.points} points
								</p>
							</div>
						</div>
						<div class="flex-shrink-0">
							<Badge variant="secondary" class="bg-indigo-100 text-indigo-800">
								{user.points}
							</Badge>
						</div>
					</div>
				{/each}
			</div>
			
			{#if leaderboard.length > 10}
				<div class="mt-4 text-center">
					<p class="text-xs text-gray-500">
						Showing top 10 of {leaderboard.length} citizens
					</p>
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>
