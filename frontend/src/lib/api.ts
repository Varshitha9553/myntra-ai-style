const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('myntra_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export function resolveImageUrl(url?: string) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}

export async function getWardrobeItems(params?: { q?: string; category?: string; color?: string; occasion?: string; season?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
  }
  const queryString = query.toString();
  return request<any>(`/api/wardrobe${queryString ? `?${queryString}` : ''}`);
}

export async function uploadWardrobeItem(formData: FormData) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('myntra_token') : null;
  return fetch(`${API_BASE_URL}/api/wardrobe`, {
    method: 'POST',
    body: formData,
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  }).then(async (response) => {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Upload failed');
    }
    return response.json();
  });
}

export async function addWardrobeItemDirect(payload: any) {
  return request<any>('/api/wardrobe/direct', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: any) {
  return request<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: any) {
  return request<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUserProfile() {
  return request<any>('/api/auth/profile');
}

export async function updateUserProfile(payload: any) {
  return request<any>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getWishlist() {
  return request<any[]>('/api/wishlist');
}

export async function addToWishlist(payload: any) {
  return request<any>('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function removeFromWishlist(id: number) {
  return request<any>(`/api/wishlist/${id}`, {
    method: 'DELETE',
  });
}

export async function analyzeShopping(selectedProduct: Record<string, unknown>) {
  return request<any>('/api/shopping/analyze', {
    method: 'POST',
    body: JSON.stringify({ selectedProduct }),
  });
}

export async function checkDuplicate(selectedProduct: Record<string, unknown>) {
  return request<any>('/api/duplicate/check', {
    method: 'POST',
    body: JSON.stringify({ selectedProduct }),
  });
}

export async function getAnalytics() {
  return request<any>('/api/analytics');
}

export async function askAssistant(message: string) {
  return request<any>('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function generateOutfit(occasion: string, weather: string) {
  return request<{ outfit: any; ai: any }>('/api/outfit/generate', {
    method: 'POST',
    body: JSON.stringify({ occasion, weather }),
  });
}

export async function getAutoWeather() {
  return request<any>('/api/weather/auto');
}

export async function reviseOutfit(occasion: string, weather: string, previousOutfitIds: string[]) {
  return request<{ outfit?: any; signature?: string; exhausted?: boolean; message?: string }>('/api/outfit/revise', {
    method: 'POST',
    body: JSON.stringify({ occasion, weather, previousOutfitIds }),
  });
}

export async function wearOutfit(outfitId: number, itemIds: number[], occasion: string, weather: string) {
  return request<{ message: string }>('/api/outfit/wear', {
    method: 'POST',
    body: JSON.stringify({ outfitId, itemIds, occasion, weather }),
  });
}

export async function analyzeShoppingAssistant(productId?: number, customProduct?: any, myntraUrl?: string) {
  return request<any>('/api/shopping-assistant/analyze', {
    method: 'POST',
    body: JSON.stringify({ productId, customProduct, myntraUrl }),
  });
}

export async function getGeneratedOutfits() {
  return request<{ outfits: any[] }>('/api/outfit');
}

export async function getCombinations() {
  return request<{ combinations: any[] }>('/api/outfit/combinations');
}

export async function getRecommendations() {
  return request<any>('/api/recommendations');
}

export async function updateWardrobeItem(id: string | number, payload: Record<string, unknown>) {
  return request(`/api/wardrobe/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteWardrobeItem(id: string | number) {
  return request(`/api/wardrobe/${id}`, { method: 'DELETE' });
}

export async function getWeatherByCoordinates(lat: number, lon: number) {
  return request<any>('/api/weather/coordinates', {
    method: 'POST',
    body: JSON.stringify({ lat, lon }),
  });
}

export async function getWeatherByCity(city: string) {
  return request<any>('/api/weather/city', {
    method: 'POST',
    body: JSON.stringify({ city }),
  });
}

export async function getPersonalizationProfile() {
  return request<any>('/api/personalization/profile');
}

export async function getPersonalizationInsights() {
  return request<any[]>('/api/personalization/insights');
}

export async function getPersonalizationAnalytics() {
  return request<any>('/api/personalization/analytics');
}
