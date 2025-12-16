// src\lib\api\detalles.ts

import type { IncidenteDetalles } from "$lib/types/incidentes/detalles";

const API = `http://localhost:8000/api/incidentes/Incidentes`;


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


export async function obtenerDetalles(id_incidente: number): Promise<IncidenteDetalles> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/detalles/${id_incidente}`, {headers});

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Error obteniendo detalles: " + err);
  }

  return res.json();
}
