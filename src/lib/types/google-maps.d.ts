declare global {
	interface Window {
		google: typeof google;
	}
}

declare namespace google {
	namespace maps {
		class Map {
			constructor(element: HTMLElement, options: MapOptions);
			addListener(eventName: string, handler: Function): void;
			setCenter(latLng: LatLng): void;
			setZoom(zoom: number): void;
			getBounds(): LatLngBounds | undefined;
		}

		class Marker {
			constructor(options: MarkerOptions);
			setMap(map: Map | null): void;
			getTitle(): string;
			addListener(eventName: string, handler: Function): void;
		}

		class Geocoder {
			geocode(request: GeocoderRequest): Promise<GeocoderResult>;
		}

		class LatLng {
			constructor(lat: number, lng: number);
			lat(): number;
			lng(): number;
		}

		class LatLngBounds {
			constructor(sw: LatLng, ne: LatLng);
		}

		class Size {
			constructor(width: number, height: number);
		}

		class Point {
			constructor(x: number, y: number);
		}

		class InfoWindow {
			constructor(options: InfoWindowOptions);
			open(map: Map, marker: Marker): void;
		}

		interface MapOptions {
			zoom: number;
			center: LatLngLiteral;
			mapTypeControl?: boolean;
			streetViewControl?: boolean;
			fullscreenControl?: boolean;
		}

		interface MarkerOptions {
			position: LatLngOrLiteral;
			map: Map;
			title?: string;
			animation?: Animation;
			icon?: string | Icon;
		}

		interface Icon {
			url: string;
			scaledSize?: Size;
			anchor?: Point;
		}

		interface InfoWindowOptions {
			content: string;
		}

		interface LatLngLiteral {
			lat: number;
			lng: number;
		}

		// Allow both LatLng objects and LatLngLiteral for position
		type LatLngOrLiteral = LatLng | LatLngLiteral;

		interface GeocoderRequest {
			location: LatLng;
		}

		interface GeocoderResult {
			results: GeocoderResultItem[];
		}

		interface GeocoderResultItem {
			formatted_address: string;
		}

		interface MapMouseEvent {
			latLng: LatLng;
		}

		enum Animation {
			DROP = 1
		}

		namespace places {
			class SearchBox {
				constructor(input: HTMLInputElement);
				setBounds(bounds: LatLngBounds): void;
				addListener(eventName: string, handler: Function): void;
				getPlaces(): PlaceResult[];
			}

			interface PlaceResult {
				geometry?: {
					location: LatLng;
				};
			}
		}
	}
}
