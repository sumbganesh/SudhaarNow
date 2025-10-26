<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let allBadges: any[];
	export let userBadges: any[];
	export let currentPoints: number;

	// Create a set of earned badge IDs for quick lookup
	$: earnedBadgeIds = new Set(userBadges.map(ub => ub.badge?.id).filter(Boolean));
</script>

<Card>
	<CardHeader>
		<CardTitle>All Badges & Criteria</CardTitle>
		<CardDescription>
			Discover all available badges and the points needed to earn them
		</CardDescription>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			{#each allBadges as badge}
				{@const isEarned = earnedBadgeIds.has(badge.id)}
				{@const isUnlocked = currentPoints >= badge.pointsRequired}
				<div class="flex items-center justify-between p-4 border rounded-lg {isEarned ? 'bg-green-50 border-green-200' : isUnlocked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}">
					<div class="flex items-center space-x-4">
						<div class="text-3xl {isEarned ? 'opacity-100' : 'opacity-50'}">
							{badge.icon}
						</div>
						<div>
							<div class="flex items-center space-x-2">
								<h3 class="font-semibold text-gray-900">{badge.name}</h3>
								{#if isEarned}
									<Badge variant="secondary" class="bg-green-100 text-green-800">
										Earned
									</Badge>
								{:else if isUnlocked}
									<Badge variant="secondary" class="bg-blue-100 text-blue-800">
										Available
									</Badge>
								{/if}
							</div>
							<p class="text-sm text-gray-600 mt-1">{badge.description || 'No description available'}</p>
						</div>
					</div>
					<div class="text-right">
						<div class="text-sm font-medium text-gray-900">
							{badge.pointsRequired} points
						</div>
						{#if isEarned}
							<div class="text-xs text-green-600">
								Earned ✓
							</div>
						{:else if isUnlocked}
							<div class="text-xs text-blue-600">
								Ready to claim!
							</div>
						{:else}
							<div class="text-xs text-gray-500">
								{Math.max(0, badge.pointsRequired - currentPoints)} more points needed
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		
		{#if allBadges.length === 0}
			<div class="text-center py-8 text-gray-500">
				<div class="text-4xl mb-2">🏆</div>
				<p>No badges available yet. Check back later!</p>
			</div>
		{/if}
	</CardContent>
</Card>
