/**
 * Map Service
 * Provides a clean, promise-based interface for Google Maps services
 * adapted from the provided reference code for frontend integration.
 */

class MapService {
  constructor() {
    this.geocoder = null;
  }

  /**
   * Initialize services if google object is available
   */
  init() {
    if (window.google && !this.geocoder) {
      this.geocoder = new window.google.maps.Geocoder();
      // DirectionsService is deprecated, we use routes library computeRoutes
    }
  }

  /**
   * Geocode an address using Google Maps SDK
   * @param {string} address - Address to geocode
   * @returns {Promise} Geocoding results
   */
  async geocodeAddress(address) {
    this.init();
    if (!this.geocoder) throw new Error('Google Maps SDK not loaded');

    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get directions between two points using the new Routes API
   * @param {Object|string} origin - Starting point {lat, lng}
   * @param {Object|string} destination - Ending point {lat, lng}
   * @param {string} travelMode - Mode of travel (DRIVE, BICYCLE, etc.)
   * @returns {Promise} Directions results
   */
  async getDirections(origin, destination, travelMode = 'DRIVE') {
    if (!window.google?.maps?.routes) {
      throw new Error('Google Maps Routes library not loaded');
    }

    const routesLibrary = window.google.maps.routes;
    
    const request = {
      origin: {
        location: {
          latLng: typeof origin === 'string' ? origin : { lat: origin.lat, lng: origin.lng }
        }
      },
      destination: {
        location: {
          latLng: typeof destination === 'string' ? destination : { lat: destination.lat, lng: destination.lng }
        }
      },
      travelMode: travelMode === 'DRIVING' ? 'DRIVE' : travelMode,
      routingPreference: 'TRAFFIC_AWARE',
    };

    try {
      const response = await routesLibrary.Route.computeRoutes(request);
      return response;
    } catch (error) {
      throw new Error(`Routes request failed: ${error.message}`);
    }
  }

  /**
   * Reverse geocode coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise} Address results
   */
  async reverseGeocode(lat, lng) {
    this.init();
    if (!this.geocoder) throw new Error('Google Maps SDK not loaded');

    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK') {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }
}

export const mapService = new MapService();
export default mapService;
