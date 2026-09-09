/**
 * CEP (Código de Endereçamento Postal) formatting and auto-lookup utilities.
 * Connects to public Brazilian CEP APIs (ViaCEP with BrasilAPI fallback)
 * to automatically fetch street, neighborhood, city, and state.
 */

export interface CepAddressResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cityState: string; // e.g. "São Paulo - SP"
  complement?: string;
}

/**
 * Removes non-numeric characters from a CEP string.
 */
export function cleanCEP(cep: string): string {
  return (cep || '').replace(/\D/g, '');
}

/**
 * Formats a string of digits into CEP mask: 00000-000
 */
export function formatCEP(value: string): string {
  const digits = cleanCEP(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Validates if the CEP contains exactly 8 digits.
 */
export function isValidCEP(cep: string): boolean {
  const digits = cleanCEP(cep);
  return digits.length === 8;
}

/**
 * Fetches address details using ViaCEP API with BrasilAPI as resilient fallback.
 */
export async function fetchAddressByCEP(rawCep: string): Promise<CepAddressResult | null> {
  const digits = cleanCEP(rawCep);
  if (digits.length !== 8) {
    return null;
  }

  // 1. Try ViaCEP (primary standard in Brazil)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (!data.erro) {
        return {
          cep: formatCEP(data.cep || digits),
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          cityState: data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : data.localidade || data.uf || '',
          complement: data.complemento || ''
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP lookup timed out or failed, trying fallback...', err);
  }

  // 2. Resilient fallback: BrasilAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const fallbackResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeoutId);

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return {
        cep: formatCEP(data.cep || digits),
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        cityState: data.city && data.state ? `${data.city} - ${data.state}` : data.city || data.state || '',
        complement: ''
      };
    }
  } catch (fallbackErr) {
    console.warn('BrasilAPI fallback lookup failed:', fallbackErr);
  }

  return null;
}

/**
 * Builds a destination query for GPS routing, guaranteeing that the CEP is appended
 * if not already present in the address text.
 * Adding the CEP enables Google Maps, Waze, and Apple Maps to locate the exact postal block.
 */
export function buildDestinationWithCEP(address: string, cep?: string): string {
  const cleanAddr = (address || '').trim();
  if (!cleanAddr) {
    return cep ? `CEP ${formatCEP(cep)}` : '';
  }

  if (!cep) {
    return cleanAddr;
  }

  const formattedCep = formatCEP(cep);
  const cleanDigits = cleanCEP(cep);

  // If the address already has this CEP, don't duplicate
  if (cleanAddr.includes(formattedCep) || (cleanDigits.length === 8 && cleanAddr.replace(/\D/g, '').includes(cleanDigits))) {
    return cleanAddr;
  }

  return `${cleanAddr}, CEP ${formattedCep}`;
}
