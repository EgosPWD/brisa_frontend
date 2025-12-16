// src\lib\api\temporal.ts
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

export async function getEstudiantes() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/estudiantes-temporal`, {
    headers,
  });
  if (!res.ok) throw new Error("Error al obtener estudiantes");
  return res.json();
}

export async function getProfesores() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/profesores-temporal`, {
    headers,
  });
  if (!res.ok) throw new Error("Error al obtener profesores");
  return res.json();
}

export async function getSituaciones() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/situaciones-temporal`, {
    headers,
  });
  if (!res.ok) throw new Error("Error al obtener situaciones");
  return res.json();
}


export async function getRoles() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/roles-temporal`, {
    headers,
  });
  if (!res.ok) throw new Error("Error al obtener roles");
  return res.json();
}


export async function getUsuariosPorRol(rol_nombre: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/usuarios-por-rol-temporal/${rol_nombre}`, {
    headers,
  });
  if (!res.ok) throw new Error("Error al obtener usuarios por rol");
  return res.json();
}