// src/lib/api/situaciones.ts

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
// GET — listar situaciones
export async function getSituaciones() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/situaciones`, {
    method: "GET",
    headers
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// POST — crear situación (✅ permitido para todos)
export async function crearSituacion(data: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/situaciones`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// PATCH — actualizar situación (🔒 solo Director en backend)
export async function actualizarSituacion(id_situacion: number, data: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/situaciones/${id_situacion}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// DELETE — borrar situación (🔒 solo Director en backend)
export async function eliminarSituacion(id_situacion: number) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/situaciones/${id_situacion}`, {
    method: "DELETE",
    headers
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ✅ NUEVO: consulta de permiso real al backend de Incidentes */
export async function getPermisoDirector() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/permisos/director`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ isDirector: boolean }>;
}
