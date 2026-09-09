import { buildDestinationWithCEP } from './cep';

/**
 * Strips apartment, room, suite, floor, and building annotations from an address string
 * so GPS search engines (Google Maps, Waze, Apple Maps) can accurately pinpoint
 * the street coordinates without failing due to internal building notations.
 */
export function cleanAddressForGps(address: string): string {
  if (!address) return '';
  return address
    // Remove " - 5º Andar", " - 2º Pavimento", etc.
    .replace(/\s*-\s*\d+º\s*(?:andar|pavimento)?/gi, '')
    // Remove " - Apto 101", " - Sala 42", " - Bloco B", " - Conjunto 12", etc.
    .replace(/\s*-\s*(?:apto|apt|apartamento|sala|conjunto|cj|bloco|bl|loja|fundos|galpão|km)\s*[\w\d\s\/\.]+/gi, '')
    // Remove standalone "/ Sala 10", "/ Apto 2"
    .replace(/\s*\/\s*(?:apto|apt|apartamento|sala|conjunto|cj|bloco|bl|loja|fundos)\s*[\w\d\s]+/gi, '')
    .trim();
}

/**
 * Builds the optimal GPS destination query string, cleaned of internal building noise
 * and with postal code (CEP) included for pinpoint neighborhood block routing.
 */
export function getCleanGpsDestination(address: string, cep?: string): string {
  const cleaned = cleanAddressForGps(address);
  return buildDestinationWithCEP(cleaned || address, cep);
}

/**
 * Device detection helpers for platform-optimized GPS navigation
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Returns direct Google Maps Turn-by-Turn Directions URL.
 * Automatically opens the Google Maps App on mobile devices with route prepared.
 * Uses `maps.google.com/maps?daddr=` which is natively registered in both
 * Android and iOS package manifests for seamless app opening without web redirects.
 */
export function getGoogleMapsRouteUrl(address: string, cep?: string): string {
  const destination = getCleanGpsDestination(address, cep);
  const encoded = encodeURIComponent(destination);
  return `https://maps.google.com/maps?daddr=${encoded}&travelmode=driving`;
}

/**
 * Returns direct Waze Navigation URL with navigate=yes.
 * Opens the Waze app directly in turn-by-turn navigation mode.
 */
export function getWazeRouteUrl(address: string, cep?: string): string {
  const destination = getCleanGpsDestination(address, cep);
  const encoded = encodeURIComponent(destination);
  return `https://waze.com/ul?q=${encoded}&navigate=yes`;
}

/**
 * Waze direct mobile scheme (deep-link for native app launch)
 */
export function getWazeDeepLink(address: string, cep?: string): string {
  const destination = getCleanGpsDestination(address, cep);
  const encoded = encodeURIComponent(destination);
  return `waze://?q=${encoded}&navigate=yes`;
}

/**
 * Returns direct Apple Maps Turn-by-Turn Driving Route URL.
 * Opens Apple Maps natively on iOS/macOS with driving directions.
 */
export function getAppleMapsRouteUrl(address: string, cep?: string): string {
  const destination = getCleanGpsDestination(address, cep);
  const encoded = encodeURIComponent(destination);
  return `https://maps.apple.com/?daddr=${encoded}&dirflg=d`;
}

/**
 * Apple Maps direct mobile scheme for iOS
 */
export function getAppleMapsDeepLink(address: string, cep?: string): string {
  const destination = getCleanGpsDestination(address, cep);
  const encoded = encodeURIComponent(destination);
  return `maps://?daddr=${encoded}&dirflg=d`;
}

/**
 * Android Geo Intent URL.
 * Launches Android's native app selector (Google Maps, Waze, etc.) or default GPS app.
 */
export function getAndroidGeoUrl(address: string, cep?: string): string {
  const destination = getCleanGpsDestination(address, cep);
  const encoded = encodeURIComponent(destination);
  return `geo:0,0?q=${encoded}`;
}

/**
 * Opens navigation route with a single click.
 * Default is Google Maps (universal compatibility across Android, iOS, and Web).
 * Uses an anchor element to avoid mobile popup blockers and trigger OS deep linking.
 */
export function openNavigationRoute(
  address: string,
  cep?: string,
  app: 'google' | 'waze' | 'apple' | 'geo' = 'google'
): void {
  if (!address && !cep) return;
  
  let url = getGoogleMapsRouteUrl(address, cep);
  if (app === 'waze') {
    url = isMobileDevice() ? getWazeRouteUrl(address, cep) : getWazeRouteUrl(address, cep);
  } else if (app === 'apple') {
    url = isIOS() ? getAppleMapsDeepLink(address, cep) : getAppleMapsRouteUrl(address, cep);
  } else if (app === 'geo') {
    url = getAndroidGeoUrl(address, cep);
  }

  // Anchor click is not blocked by mobile popup blockers and safely triggers OS intent
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);
  } catch {
    window.location.href = url;
  }
}

