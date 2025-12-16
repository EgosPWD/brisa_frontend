// src/lib/api/areas.ts

const API_URL = `http://localhost:8000/api/incidentes/Incidentes`;

async function getAuthHeaders() {
  const token = localStorage.getItem('brisa_auth_token');

  if (!token) {
    throw new Error('No autenticado. Por favor inicia sesión.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function getAreas() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/areas`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function crearArea(data: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/areas`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function actualizarArea(id_area: number, data: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/areas/${id_area}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function eliminarArea(id_area: number) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/areas/${id_area}`, {
    method: "DELETE",
    headers
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPermisoDirector() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/permisos/director`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ isDirector: boolean }>;
}