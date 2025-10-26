<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Notifications from '$lib/components/Notifications.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import BadgesCard from '$lib/components/BadgesCard.svelte';

	export let data: PageData;

	let user = data.user;
	let stats = data.stats;
	let badges = data.badges;
	let allBadges = data.allBadges;
	let notifications = data.notifications || [];

	async function markNotificationAsRead(notificationId: string) {
		try {
			const response = await fetch('/api/notifications/mark-read', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ notificationId })
			});

			if (response.ok) {
				// Update local state
				notifications = notifications.map(n => 
					n.id === notificationId ? { ...n, read: true } : n
				);
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	}
</script>

<svelte:head>
	<title>Citizen Dashboard - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900">SudhaarNow</h1>
				</div>
				<div class="flex items-center space-x-2 sm:space-x-4">
					<div class="hidden sm:block text-sm text-gray-700">
						Welcome, {user.name}
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-sm font-medium text-gray-700">Points:</span>
						<Badge variant="secondary" class="bg-indigo-100 text-indigo-800">
							{stats.points}
						</Badge>
					</div>
					<Notifications {notifications} onMarkAsRead={markNotificationAsRead} />
					<form method="POST" action="/logout">
						<Button type="submit" variant="ghost" size="sm">
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
			<!-- Stats Cards -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">📝</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Issues Posted</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.issuesPosted}</dd>
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
									<dt class="text-sm font-medium text-gray-500 truncate">Issues Resolved</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.issuesResolved}</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
									<span class="text-white text-sm font-medium">🏆</span>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="text-sm font-medium text-gray-500 truncate">Total Points</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.points}</dd>
								</dl>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Action Buttons -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
				<Card>
					<CardHeader>
						<CardTitle>Report New Issue</CardTitle>
						<CardDescription>
							Help improve your community by reporting civic issues like potholes, garbage, streetlight problems, and more.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button href="/citizen/report">
							Report Issue
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>My Issues</CardTitle>
						<CardDescription>
							Track the status of issues you've reported and see updates from authorities.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button href="/citizen/issues" variant="secondary">
							View My Issues
						</Button>
					</CardContent>
				</Card>
			</div>

			<!-- Badges and Leaderboard Section -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Badges Section -->
				<Card>
					<CardHeader>
						<CardTitle>Your Badges</CardTitle>
					</CardHeader>
					<CardContent>
						{#if badges.length === 0}
							<div class="text-sm text-gray-500">
								No badges yet. Keep reporting issues to earn your first badge!
							</div>
						{:else}
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
								{#each badges as { badge, earnedAt }}
									{#if badge}
										<div class="text-center">
											<div class="text-4xl mb-2">{badge.icon}</div>
											<div class="text-sm font-medium text-gray-900">{badge.name}</div>
											<div class="text-xs text-gray-500">Earned {new Date(earnedAt).toLocaleDateString()}</div>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Leaderboard Section -->
				<Leaderboard leaderboard={data.leaderboard} currentUser={user} />
			</div>

			<!-- All Badges Section -->
			<div class="mt-8">
				<BadgesCard {allBadges} userBadges={badges} currentPoints={stats.points} />
			</div>
		</div>
	</main>
</div>
