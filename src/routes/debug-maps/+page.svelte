<script lang="ts">
	import GoogleMap from '$lib/components/GoogleMap.svelte';
	
	// Google Maps API Key - will be set via environment variable
	const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key_here';
	
	let selectedLocation: { lat: number; lng: number; address: string } | null = null;
	
	function handleLocationSelect(location: { lat: number; lng: number; address: string }) {
		selectedLocation = location;
		console.log('Location selected:', location);
	}
</script>

<svelte:head>
	<title>Google Maps Debug - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">Google Maps Debug Page</h1>
		
		<!-- API Key Status -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">API Key Status</h2>
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="font-medium">API Key:</span>
					{#if GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here'}
						<span class="text-red-600 font-mono text-sm">Not configured (using placeholder)</span>
					{:else}
						<span class="text-green-600 font-mono text-sm">{GOOGLE_MAPS_API_KEY.substring(0, 10)}...</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<span class="font-medium">Environment:</span>
					<span class="text-gray-600">{import.meta.env.MODE}</span>
				</div>
			</div>
		</div>
		
		<!-- Map Component -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">Interactive Map</h2>
			<GoogleMap
				apiKey={GOOGLE_MAPS_API_KEY}
				center={{ lat: 40.7128, lng: -74.0060 }}
				zoom={13}
				height="500px"
				enableSearch={true}
				enableClickToSelect={true}
				onLocationSelect={handleLocationSelect}
			/>
		</div>
		
		<!-- Selected Location -->
		{#if selectedLocation}
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Selected Location</h2>
				<div class="space-y-2">
					<div><strong>Address:</strong> {selectedLocation.address}</div>
					<div><strong>Latitude:</strong> {selectedLocation.lat}</div>
					<div><strong>Longitude:</strong> {selectedLocation.lng}</div>
				</div>
			</div>
		{/if}
		
		<!-- Instructions -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
			<h3 class="text-lg font-semibold text-blue-900 mb-2">Debug Instructions</h3>
			<ol class="list-decimal list-inside space-y-1 text-blue-800">
				<li>Open browser developer tools (F12)</li>
				<li>Check the Console tab for any error messages</li>
				<li>Look for "Initializing Google Maps with new functional API..." message</li>
				<li>Look for "Google Maps API loaded successfully" message</li>
				<li>Look for "Map instance created successfully" message</li>
				<li>If you see "API Key not configured", you need to set the GOOGLE_MAPS_API_KEY environment variable</li>
				<li>If the script fails to load, check your API key restrictions and billing</li>
			</ol>
		</div>
		
		<!-- SDK Information -->
		<div class="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
			<h3 class="text-lg font-semibold text-green-900 mb-2">✅ Using Official Google Maps SDK</h3>
			<p class="text-green-800 mb-2">
				This implementation now uses the official <code>@googlemaps/js-api-loader</code> package with the new functional API which:
			</p>
			<ul class="list-disc list-inside space-y-1 text-green-800">
				<li>Handles script loading automatically</li>
				<li>Manages API initialization properly</li>
				<li>Provides better error handling</li>
				<li>Supports dynamic library loading</li>
				<li>Eliminates timing issues</li>
			</ul>
		</div>
	</div>
</div>
