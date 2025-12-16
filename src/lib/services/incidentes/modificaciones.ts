// src\lib\api\modificaciones.ts
import type { IncidenteUpdate, ModificacionHistorial } from "$lib/types/incidentes/modificaciones";

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

export async function modificarIncidente(id: number, data: IncidenteUpdate) {

  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/modificaciones/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Error modificando incidente: " + err);
  }

  return res.json();
}

export async function obtenerHistorial(id_incidente: number): Promise<ModificacionHistorial[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/modificaciones/${id_incidente}`, {headers});

  if (!res.ok) throw new Error("Error obteniendo historial");

  return res.json();
}
