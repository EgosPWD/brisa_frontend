// HTTP client helpers centralized here
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, ''); // strip trailing slashes to avoid // paths

function getAuthHeaders(): Record<string, string> {
	if (typeof window === 'undefined') return {};
	const token = localStorage.getItem('brisa_auth_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export function buildQuery(params?: Record<string, unknown>): string {
	if (!params) return '';
	const qs = Object.entries(params)
		.filter(([, v]) => v !== undefined && v !== null && v !== '')
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
		.join('&');
	return qs ? `?${qs}` : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	const url = `${API_BASE_URL}${normalizedEndpoint}`;
	
	console.log(`[http] ${options.method || 'GET'} ${url}`);

	const defaultHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...getAuthHeaders()
	};

	const config: RequestInit = {
		...options,
		headers: {
			...defaultHeaders,
			...(options.headers || {})
		}
	};

	const response = await fetch(url, config);

	if (!response.ok) {
		if (response.status === 401 && typeof window !== 'undefined') {
			localStorage.removeItem('brisa_auth_token');
			localStorage.removeItem('brisa_user_data');
			window.location.href = '/login';
		}
		const errorData = await response.json().catch(() => ({}));
		throw {
			message: (errorData as any).message || `HTTP Error: ${response.status}`,
			details: errorData,
			status: response.status
		};
	}

	// Si es 204 No Content, no hay body que parsear
	if (response.status === 204) {
		return null as T;
	}

	return response.json();
}

async function downloadFile(endpoint: string): Promise<Blob> {
	const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	const url = `${API_BASE_URL}${normalizedEndpoint}`;

	const config: RequestInit = {
		method: 'GET',
		headers: getAuthHeaders()
	};

	const response = await fetch(url, config);

	if (!response.ok) {
		if (response.status === 401 && typeof window !== 'undefined') {
			localStorage.removeItem('brisa_auth_token');
			localStorage.removeItem('brisa_user_data');
			window.location.href = '/login';
		}
		throw new Error(`Error al descargar archivo: ${response.status}`);
	}

	return response.blob();
}

export const http = {
	get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
	post: <T>(endpoint: string, data?: unknown) => {
		// Si data es FormData, no establecer Content-Type (el navegador lo hace automáticamente con boundary)
		if (data instanceof FormData) {
			const headers = getAuthHeaders();
			const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
			const url = `${API_BASE_URL}${normalizedEndpoint}`;
			return fetch(url, {
				method: 'POST',
				headers,
				body: data
			}).then(async (response) => {
				if (!response.ok) {
					if (response.status === 401 && typeof window !== 'undefined') {
						localStorage.removeItem('brisa_auth_token');
						localStorage.removeItem('brisa_user_data');
						window.location.href = '/login';
					}
					const errorData = await response.json().catch(() => ({}));
					throw {
						message: (errorData as any).message || `HTTP Error: ${response.status}`,
						details: errorData,
						status: response.status
					};
				}
				return response.json();
			}) as Promise<T>;
		}
		return request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
	},
	put: <T>(endpoint: string, data: unknown) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
	patch: <T>(endpoint: string, data: unknown) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
	del: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
	downloadFile,
	buildQuery
};
