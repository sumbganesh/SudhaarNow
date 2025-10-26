<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import GoogleMap from '$lib/components/GoogleMap.svelte';
	import exifr from 'exifr';

	// Google Maps API Key - will be set via environment variable
	const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key_here';

	export let data: PageData;
	export let form;

	let selectedLocation: { lat: number; lng: number; address: string } | null = null;
	let selectedFiles: File[] = [];
	let isSubmitting = false;
	let photoGeotagInfo: { lat?: number; lng?: number; hasGeotag: boolean } = { hasGeotag: false };
	let selectedCategoryId: string = '';
	let photoGeotags: Array<{ file: File; lat: number; lng: number; address?: string }> = [];
	let selectedGeotagIndex: number = -1;

	function handleLocationSelect(location: { lat: number; lng: number; address: string }) {
		selectedLocation = location;
	}

	// Handle form submission success/error
	$: if (form?.success) {
		toast.success('Issue reported successfully!', {
			description: 'You earned 10 points for reporting this issue.'
		});
		// Reset form state
		selectedFiles = [];
		isSubmitting = false;
		// Redirect to issues page after successful submission (client-side only)
		if (typeof window !== 'undefined') {
			setTimeout(() => {
				goto('/citizen/issues');
			}, 2000);
		}
	} else if (form?.message && !form?.success) {
		toast.error('Failed to report issue', {
			description: form.message
		});
		isSubmitting = false;
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const files = Array.from(target.files);
			selectedFiles = files;
			
			// Reset previous geotag data
			photoGeotags = [];
			selectedGeotagIndex = -1;
			photoGeotagInfo = { hasGeotag: false };
			
			// Process all photos for geotags
			const geotagPromises = files.map(async (file) => {
				if (file.type.startsWith('image/')) {
					const geotag = await extractGeotagFromPhoto(file);
					if (geotag.hasGeotag && geotag.lat && geotag.lng) {
						// Get address for this location
						try {
							const address = await reverseGeocode(geotag.lat, geotag.lng);
							return {
								file,
								lat: geotag.lat,
								lng: geotag.lng,
								address: address || `Location from photo (${geotag.lat.toFixed(6)}, ${geotag.lng.toFixed(6)})`
							};
						} catch (error) {
							console.error('Reverse geocoding failed for photo:', file.name, error);
							return {
								file,
								lat: geotag.lat,
								lng: geotag.lng,
								address: `Location from photo (${geotag.lat.toFixed(6)}, ${geotag.lng.toFixed(6)})`
							};
						}
					}
				}
				return null;
			});
			
			const geotagResults = await Promise.all(geotagPromises);
			photoGeotags = geotagResults.filter(result => result !== null) as Array<{ file: File; lat: number; lng: number; address?: string }>;
			
			// Handle different scenarios
			if (photoGeotags.length === 0) {
				// No geotags found
				photoGeotagInfo = { hasGeotag: false };
			} else if (photoGeotags.length === 1) {
				// Single geotag - use it automatically
				const geotag = photoGeotags[0];
				photoGeotagInfo = { lat: geotag.lat, lng: geotag.lng, hasGeotag: true };
				selectedLocation = {
					lat: geotag.lat,
					lng: geotag.lng,
					address: geotag.address || `Location from photo (${geotag.lat.toFixed(6)}, ${geotag.lng.toFixed(6)})`
				};
				selectedGeotagIndex = 0;
			} else {
				// Multiple geotags - let user choose
				photoGeotagInfo = { hasGeotag: true };
				// Don't set selectedLocation yet - wait for user selection
			}
		}
	}

	async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
		try {
			const response = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
			);
			const data = await response.json();
			
			if (data.status === 'OK' && data.results.length > 0) {
				return data.results[0].formatted_address;
			}
			return null;
		} catch (error) {
			console.error('Reverse geocoding error:', error);
			return null;
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	function selectGeotag(index: number) {
		selectedGeotagIndex = index;
		const geotag = photoGeotags[index];
		photoGeotagInfo = { lat: geotag.lat, lng: geotag.lng, hasGeotag: true };
		selectedLocation = {
			lat: geotag.lat,
			lng: geotag.lng,
			address: geotag.address || `Location from photo (${geotag.lat.toFixed(6)}, ${geotag.lng.toFixed(6)})`
		};
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	async function extractGeotagFromPhoto(file: File): Promise<{ lat?: number; lng?: number; hasGeotag: boolean }> {
		try {
			console.log('Extracting geotag from file:', file.name, 'Type:', file.type);
			
			// Convert File to ArrayBuffer for exifr
			const arrayBuffer = await file.arrayBuffer();
			const exif = await exifr.parse(arrayBuffer, { gps: true });
			
			console.log('EXIF data:', exif);
			
			if (exif && exif.latitude && exif.longitude) {
				console.log('Geotag found:', exif.latitude, exif.longitude);
				return {
					lat: exif.latitude,
					lng: exif.longitude,
					hasGeotag: true
				};
			} else {
				console.log('No geotag found in photo');
				return { hasGeotag: false };
			}
		} catch (error) {
			console.error('Error extracting geotag:', error);
			return { hasGeotag: false };
		}
	}

</script>

<svelte:head>
	<title>Report Issue - SudhaarNow</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div class="flex items-center">
					<Button variant="ghost">
						<a href="/citizen">← Back to Dashboard</a>
					</Button>
					<h1 class="text-2xl font-bold text-gray-900 ml-4">Report New Issue</h1>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<form method="POST" action="?/create" enctype="multipart/form-data" class="space-y-6" onsubmit={() => {
				isSubmitting = true;
			}}>
				{#if form?.message}
					<Card class={form?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
						<CardContent class="p-4">
							<div class="flex items-center">
								{#if form?.success}
									<svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									<span class="text-green-600">{form.message}</span>
								{:else}
									<svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="text-red-600">{form.message}</span>
								{/if}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Basic Information Card -->
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>Provide details about the issue you're reporting</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Issue Title -->
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-2">Issue Title</label>
							<Input
								type="text"
								name="title"
								id="title"
								required
								placeholder="Brief description of the issue"
							/>
						</div>

						<!-- Issue Description -->
						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
							<Textarea
								name="description"
								id="description"
								rows={4}
								required
								placeholder="Provide detailed information about the issue..."
							/>
						</div>

						<!-- Category Selection -->
						<div>
							<label for="categoryId" class="block text-sm font-medium text-gray-700 mb-2">Issue Category</label>
							<Select.Root type="single" bind:value={selectedCategoryId}>
								<Select.Trigger>
									<Select.Value placeholder="Choose the category that best describes your issue" />
								</Select.Trigger>
								<Select.Content>
									{#each data.categories as category}
										<Select.Item value={category.id}>
											{category.name} - {category.department}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="categoryId" id="categoryId" value={selectedCategoryId} required />
						</div>
					</CardContent>
				</Card>

				<!-- Photo Upload Card -->
				<Card>
					<CardHeader>
						<CardTitle>Photos (Required)</CardTitle>
						<CardDescription>Upload at least one photo to help authorities understand the issue better</CardDescription>
					</CardHeader>
					<CardContent>
						<!-- Geotag Information Note -->
						<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
							<div class="flex items-start">
								<svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<p class="text-sm text-blue-800 font-medium">Enable Location Services for Photos</p>
									<p class="text-xs text-blue-600 mt-1">
										For better location verification, please enable geotagging in your camera settings. 
										Photos with location data will automatically prefill the map location below.
									</p>
								</div>
							</div>
						</div>

						<div class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
							<div class="space-y-1 text-center">
								<svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
									<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<div class="flex text-sm text-gray-600">
									<label for="photos" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
										<span>Upload photos</span>
										<input 
											id="photos" 
											name="photos" 
											type="file" 
											class="sr-only" 
											multiple 
											accept="image/*" 
											onchange={handleFileSelect}
											required={true}
										/>
									</label>
									<p class="pl-1">or drag and drop</p>
								</div>
								<p class="text-xs text-gray-500">PNG, JPG, WebP up to 5MB each</p>
							</div>
						</div>

						<!-- Geotag Status Display - Show immediately after upload -->
						{#if selectedFiles.length > 0}
							<div class="mt-4">
								{#if photoGeotags.length === 0}
									<!-- No geotags found -->
									<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
										<div class="flex items-center">
											<svg class="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<div class="flex-1">
												<p class="text-base text-yellow-800 font-semibold">⚠️ No geotag found in photos</p>
												<p class="text-sm text-yellow-600 mt-1">Please manually select location on the map below</p>
											</div>
										</div>
									</div>
								{:else if photoGeotags.length === 1}
									<!-- Single geotag found -->
									<div class="p-4 bg-green-50 border border-green-200 rounded-lg">
										<div class="flex items-center">
											<svg class="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<div class="flex-1">
												<p class="text-base text-green-800 font-semibold">📍 Location data found in photo!</p>
												<p class="text-sm text-green-600 mt-1">Map location has been automatically prefilled below</p>
												<p class="text-sm text-green-700 mt-2 font-mono bg-green-100 px-2 py-1 rounded">
													Location from photo ({photoGeotagInfo.lat?.toFixed(6)}, {photoGeotagInfo.lng?.toFixed(6)})
												</p>
											</div>
										</div>
									</div>
								{:else}
									<!-- Multiple geotags found - let user choose -->
									<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
										<div class="flex items-center mb-3">
											<svg class="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
											<div class="flex-1">
												<p class="text-base text-blue-800 font-semibold">📍 Multiple locations found in photos!</p>
												<p class="text-sm text-blue-600 mt-1">Please select which location to use for this issue:</p>
											</div>
										</div>
										
										<div class="space-y-2">
											{#each photoGeotags as geotag, index}
												<button 
													type="button"
													class="w-full flex items-center justify-between p-3 bg-white border border-blue-200 rounded-md cursor-pointer hover:bg-blue-50 transition-colors text-left" 
													onclick={() => selectGeotag(index)}
													role="radio"
													aria-checked={selectedGeotagIndex === index}
													aria-label="Select location from {geotag.file.name}"
												>
													<div class="flex items-center space-x-3">
														<div class="flex-shrink-0">
															<img 
																src={URL.createObjectURL(geotag.file)} 
																alt={geotag.file.name}
																class="w-12 h-12 object-cover rounded"
															/>
														</div>
														<div class="flex-1 min-w-0">
															<p class="text-sm font-medium text-gray-900 truncate">{geotag.file.name}</p>
															<p class="text-sm text-gray-800 font-semibold mt-1">{geotag.address}</p>
															<p class="text-xs text-gray-400 font-mono mt-1">📍 ({geotag.lat.toFixed(6)}, {geotag.lng.toFixed(6)})</p>
														</div>
													</div>
													<div class="flex-shrink-0">
														{#if selectedGeotagIndex === index}
															<div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
																<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
																</svg>
															</div>
														{:else}
															<div class="w-5 h-5 border-2 border-blue-300 rounded-full"></div>
														{/if}
													</div>
												</button>
											{/each}
										</div>
										
										{#if selectedGeotagIndex >= 0}
											<div class="mt-3 p-3 bg-green-100 border border-green-300 rounded-md">
												<p class="text-sm text-green-800 font-medium">✅ Selected location will be used for the map below</p>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Selected Files Display -->
						{#if selectedFiles.length > 0}
							<div class="mt-4 space-y-2">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<h4 class="text-sm font-medium text-gray-700">Selected Files</h4>
										<Badge variant="secondary">{selectedFiles.length}</Badge>
									</div>
								</div>

							{#each selectedFiles as file, index}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
									<div class="flex items-center space-x-3">
										<div class="flex-shrink-0">
											{#if file.type.startsWith('image/')}
												<img 
													src={URL.createObjectURL(file)} 
													alt={file.name}
													class="w-10 h-10 object-cover rounded"
												/>
											{:else}
												<div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
													<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
												</div>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
											<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<Button 
											type="button" 
											onclick={() => removeFile(index)}
											variant="ghost"
											size="sm"
											class="text-red-500 hover:text-red-700 hover:bg-red-50"
											aria-label="Remove file"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</Button>
									</div>
								</div>
							{/each}

						</div>
					{/if}

					</CardContent>
				</Card>

				<!-- Location Selection Card -->
				<Card>
					<CardHeader>
						<CardTitle>Location</CardTitle>
						<CardDescription>Select the location where the issue occurred</CardDescription>
					</CardHeader>
					<CardContent>
						<!-- Google Map Component -->
						<div class="w-full overflow-hidden">
							<GoogleMap
								apiKey={GOOGLE_MAPS_API_KEY}
								center={photoGeotagInfo.hasGeotag && photoGeotagInfo.lat && photoGeotagInfo.lng ? 
									{ lat: photoGeotagInfo.lat, lng: photoGeotagInfo.lng } : 
									{ lat: 40.7128, lng: -74.0060 }}
								zoom={photoGeotagInfo.hasGeotag ? 15 : 13}
								height="400px"
								enableSearch={true}
								enableClickToSelect={true}
								onLocationSelect={handleLocationSelect}
							/>
						</div>
						
						<!-- Location confirmation - simplified -->
						{#if selectedLocation && !photoGeotagInfo.hasGeotag}
							<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
								<div class="flex items-center">
									<svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<Badge variant="secondary" class="bg-green-100 text-green-800">Selected Location</Badge>
										</div>
										<div class="text-sm text-green-600 mt-1">{selectedLocation.address}</div>
									</div>
								</div>
							</div>
						{:else if !selectedLocation}
							<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
								<div class="flex items-center">
									<svg class="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<div class="flex items-center gap-2">
										<Badge variant="outline" class="bg-yellow-100 text-yellow-800">Please select a location on the map or search for one</Badge>
									</div>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Hidden inputs for form data -->
				<input type="hidden" name="locationLat" value={selectedLocation?.lat || ''} />
				<input type="hidden" name="locationLng" value={selectedLocation?.lng || ''} />
				<input type="hidden" name="locationAddress" value={selectedLocation?.address || ''} />

				<!-- Submit Buttons -->
				<div class="flex justify-end space-x-3">
					<Button variant="outline">
						<a href="/citizen">Cancel</a>
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<div class="flex items-center">
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
								Submitting...
							</div>
						{:else}
							Submit Issue
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</main>
</div>
