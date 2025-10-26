<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { clickOutside } from '$lib/utils/clickOutside';
	import type { Notification } from '$lib/server/db/schema';

	let { notifications = [], onMarkAsRead = () => {} }: {
		notifications?: Notification[];
		onMarkAsRead?: (id: string) => void;
	} = $props();

	let unreadCount = $derived(notifications.filter(n => !n.read).length);

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleNotificationClick(notification: Notification) {
		if (!notification.read) {
			onMarkAsRead(notification.id);
		}
	}

	function handleClickOutside() {
		const dropdown = document.getElementById('notifications-dropdown');
		if (dropdown) {
			dropdown.classList.add('hidden');
		}
	}
</script>

<div class="relative">
	<!-- Notification Bell Icon -->
	<button
		type="button"
		class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
		onclick={() => {
			// Toggle notifications dropdown
			const dropdown = document.getElementById('notifications-dropdown');
			if (dropdown) {
				dropdown.classList.toggle('hidden');
			}
		}}
	>
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
		</svg>
		{#if unreadCount > 0}
			<span class="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	<!-- Notifications Dropdown -->
	<div
		id="notifications-dropdown"
		class="hidden absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
	>
		<div class="py-1">
			<div class="px-4 py-2 border-b border-gray-200">
				<h3 class="text-sm font-medium text-gray-900">Notifications</h3>
			</div>
			
			{#if notifications.length === 0}
				<div class="px-4 py-3 text-sm text-gray-500 text-center">
					No notifications yet
				</div>
			{:else}
				<div class="max-h-64 overflow-y-auto">
					{#each notifications.slice(0, 10) as notification}
						<button
							type="button"
							class="w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 {notification.read ? 'bg-white' : 'bg-blue-50'}"
							onclick={() => handleNotificationClick(notification)}
						>
							<div class="flex items-start">
								<div class="flex-shrink-0">
									{#if !notification.read}
										<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
									{/if}
								</div>
								<div class="ml-3 flex-1">
									<p class="text-sm text-gray-900 {notification.read ? '' : 'font-medium'}">
										{notification.message}
									</p>
									<p class="text-xs text-gray-500 mt-1">
										{formatDate(notification.createdAt)}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
				
				{#if notifications.length > 10}
					<div class="px-4 py-2 border-t border-gray-200">
						<button
							type="button"
							class="text-sm text-indigo-600 hover:text-indigo-500"
							onclick={() => {
								// Navigate to full notifications page
								window.location.href = '/citizen/notifications';
							}}
						>
							View all notifications
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<!-- Click outside to close -->
<div use:clickOutside={handleClickOutside}></div>
