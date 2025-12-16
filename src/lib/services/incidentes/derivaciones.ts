// src/lib/api/derivaciones.ts

import type { DerivacionCreate, DerivacionRead } from "$lib/types/incidentes/derivaciones";

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


export async function crearDerivacion(
  id_incidente: number,
  payload: DerivacionCreate
): Promise<DerivacionRead> {

  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/derivaciones/${id_incidente}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error("Error creando derivación: " + error);
  }

  return await res.json() as DerivacionRead;
}
