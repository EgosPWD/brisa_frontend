// src/lib/api/incidentes.ts
import type { IncidenteAPI, IncidenteCreate } from "$lib/types/incidentes/incidentes";

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

export async function getIncidentes(): Promise<IncidenteAPI[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/incidentes`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function crearIncidente(data: IncidenteCreate): Promise<IncidenteAPI> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/incidentes`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
