<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { importLibrary } from '@googlemaps/js-api-loader';

	// Props
	export let apiKey: string;
	export let center: { lat: number; lng: number } = { lat: 40.7128, lng: -74.0060 };
	export let zoom: number = 13;
	export let height: string = '400px';
	export let width: string = '100%';
	export let enableSearch: boolean = true;
	export let enableClickToSelect: boolean = true;
	export let markers: Array<{ lat: number; lng: number; title?: string; info?: string }> = [];
	export let selectedLocation: { lat: number; lng: number; address: string } | null = null;

	// Events
	export let onLocationSelect: ((location: { lat: number; lng: number; address: string }) => void) | undefined = undefined;

	// Internal state
	let mapContainer: HTMLDivElement;
	let mapInstance: google.maps.Map | null = null;
	let geocoder: google.maps.Geocoder | null = null;
	let mapMarkers: google.maps.Marker[] = [];
	let searchBox: google.maps.places.SearchBox | null = null;
	let mapLoaded = false;
	let isLoading = false;

	onMount(async () => {
		await initializeMap();
	});

	onDestroy(() => {
		// Clean up markers
		mapMarkers.forEach(marker => marker.setMap(null));
		mapMarkers = [];
	});

	async function initializeMap() {
		if (isLoading || mapLoaded) return;

		// Check if API key is valid
		if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
			toast.error('Google Maps API key not configured', {
				description: 'Please set GOOGLE_MAPS_API_KEY in your environment variables.'
			});
			return;
		}

		try {
			isLoading = true;
			console.log('Initializing Google Maps with new functional API...');

			// Wait for container to be available
			if (!mapContainer) {
				console.log('Waiting for container...');
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			// Load the Google Maps script with API key
			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
			script.async = true;
			script.defer = true;
			
			// Wait for script to load
			await new Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});

			// Import the Map library
			const { Map } = await importLibrary('maps');
			console.log('Google Maps API loaded successfully');

			// Initialize the map
			mapInstance = new Map(mapContainer, {
				zoom,
				center,
				mapTypeControl: true,
				streetViewControl: true,
				fullscreenControl: true,
				gestureHandling: 'greedy'
			});

			console.log('Map instance created successfully');

			// Import and initialize geocoder
			const { Geocoder } = await importLibrary('geocoding');
			geocoder = new Geocoder();

			// Add click listener if enabled
			if (enableClickToSelect) {
				mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
					if (event.latLng) {
						selectLocation(event.latLng);
					}
				});
			}

			// Add search box if enabled
			if (enableSearch) {
				const searchInput = document.getElementById('map-search-box');
				if (searchInput && searchInput instanceof HTMLInputElement) {
					const { SearchBox } = await importLibrary('places');
					searchBox = new SearchBox(searchInput);

					// Bias the SearchBox results towards current map's viewport
					mapInstance.addListener('bounds_changed', () => {
						if (searchBox && mapInstance) {
							searchBox.setBounds(mapInstance.getBounds()!);
						}
					});

					// Listen for the event fired when the user selects a prediction
					searchBox.addListener('places_changed', () => {
						const places = searchBox!.getPlaces();
						if (places && places.length > 0) {
							const place = places[0];
							if (place.geometry && place.geometry.location) {
								selectLocation(place.geometry.location);
								mapInstance!.setCenter(place.geometry.location);
								mapInstance!.setZoom(15);
							}
						}
					});
				}
			}

			// Add existing markers
			await addMarkers();

			mapLoaded = true;
			isLoading = false;
			
			console.log('Google Map initialized successfully');
		} catch (error) {
			console.error('Error initializing Google Map:', error);
			isLoading = false;
			toast.error('Failed to load Google Maps', {
				description: 'Please check your API key and internet connection.'
			});
		}
	}

	async function selectLocation(latLng: google.maps.LatLng) {
		if (!geocoder) return;

		try {
			const results = await geocoder.geocode({ location: latLng });
			if (results.results && results.results.length > 0) {
				const address = results.results[0].formatted_address;
				const location = {
					lat: latLng.lat(),
					lng: latLng.lng(),
					address
				};

				selectedLocation = location;

				// Update marker
				updateSelectedMarker(latLng, address);

				// Call callback if provided
				if (onLocationSelect) {
					onLocationSelect(location);
				}
			}
		} catch (error) {
			console.error('Geocoding error:', error);
			toast.error('Failed to get address for selected location');
		}
	}

	function updateSelectedMarker(latLng: google.maps.LatLng, title: string) {
		if (!mapInstance) return;

		// Remove existing selected marker (if any)
		const existingMarker = mapMarkers.find(marker => marker.getTitle() === 'Selected Location');
		if (existingMarker) {
			existingMarker.setMap(null);
			const index = mapMarkers.indexOf(existingMarker);
			if (index > -1) {
				mapMarkers.splice(index, 1);
			}
		}

		// Add new selected marker
		const marker = new google.maps.Marker({
			position: latLng,
			map: mapInstance,
			title: 'Selected Location',
			animation: google.maps.Animation.DROP,
			icon: {
				url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
					<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
						<circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
						<circle cx="16" cy="16" r="6" fill="#ffffff"/>
					</svg>
				`),
				scaledSize: new google.maps.Size(32, 32),
				anchor: new google.maps.Point(16, 16)
			}
		});

		mapMarkers.push(marker);
	}

	async function addMarkers() {
		if (!mapInstance) return;

		try {
			// Clear existing markers
			mapMarkers.forEach(marker => marker.setMap(null));
			mapMarkers = [];

			// Import Marker library
			const { Marker } = await importLibrary('marker');

			// Add new markers
			markers.forEach(markerData => {
				const marker = new Marker({
					position: { lat: markerData.lat, lng: markerData.lng },
					map: mapInstance!,
					title: markerData.title || 'Marker'
				});

				// Add info window if info is provided
				if (markerData.info) {
					const { InfoWindow } = google.maps;
					const infoWindow = new InfoWindow({
						content: markerData.info
					});

					marker.addListener('click', () => {
						infoWindow.open(mapInstance!, marker);
					});
				}

				mapMarkers.push(marker);
			});
		} catch (error) {
			console.error('Error adding markers:', error);
		}
	}

	// Reactive statements
	$: if (mapInstance && markers) {
		addMarkers();
	}

	$: if (mapInstance && center) {
		mapInstance.setCenter(new google.maps.LatLng(center.lat, center.lng));
	}

	$: if (mapInstance && zoom) {
		mapInstance.setZoom(zoom);
	}

	// Public methods
	export function setCenter(lat: number, lng: number) {
		if (mapInstance) {
			mapInstance.setCenter(new google.maps.LatLng(lat, lng));
		}
	}

	export function setZoom(newZoom: number) {
		if (mapInstance) {
			mapInstance.setZoom(newZoom);
		}
	}

	export async function addMarker(lat: number, lng: number, title?: string, info?: string) {
		if (mapInstance) {
			try {
				const { Marker } = await importLibrary('marker');
				const marker = new Marker({
					position: { lat, lng },
					map: mapInstance,
					title: title || 'Marker'
				});

				if (info) {
					const { InfoWindow } = google.maps;
					const infoWindow = new InfoWindow({
						content: info
					});

					marker.addListener('click', () => {
						infoWindow.open(mapInstance!, marker);
					});
				}

				mapMarkers.push(marker);
			} catch (error) {
				console.error('Error adding marker:', error);
			}
		}
	}

	export function clearMarkers() {
		mapMarkers.forEach(marker => marker.setMap(null));
		mapMarkers = [];
	}
</script>

<div class="google-map-container" style="width: {width}; height: {height};">
	{#if enableSearch}
		<div class="mb-4">
			<input
				id="map-search-box"
				type="text"
				placeholder="Search for a location..."
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>
	{/if}
	
	<div class="relative">
		<!-- Always render the container div, but show loading overlay when needed -->
		<div bind:this={mapContainer} class="w-full h-full rounded-lg border border-gray-300" style="min-height: {height};">
			{#if !mapLoaded}
				<div class="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-10">
					<div class="text-center">
						<div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
						<span class="text-sm text-gray-500">Loading map...</span>
						{#if !apiKey || apiKey === 'your_google_maps_api_key_here'}
							<div class="mt-2 text-xs text-red-600">
								API Key not configured
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.google-map-container {
		position: relative;
	}
</style>