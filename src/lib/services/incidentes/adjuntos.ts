import type { AdjuntoRead } from "$lib/types/incidentes/adjuntos";

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

async function getAuthHeadersMultipart() {
  const token = localStorage.getItem('brisa_auth_token');

  if (!token) {
    throw new Error('No autenticado. Por favor inicia sesión.');
  }

  return {
    'Authorization': `Bearer ${token}`
  };
}

export async function subirAdjunto(
  id_incidente: number,
  archivo: File,
  subido_por: number | null = null
): Promise<AdjuntoRead> {

  const form = new FormData();
  form.append("archivo", archivo);

  const headers = await getAuthHeadersMultipart();

  const qs = subido_por !== null ? `?id_subido_por=${subido_por}` : "";

  const res = await fetch(`${API_URL}/adjuntos/${id_incidente}${qs}`, {
    method: "POST",
    body: form,
    headers
  });

  if (!res.ok) {
    throw new Error(`Error al subir adjunto: ${await res.text()}`);
  }

  return res.json();
}

export async function obtenerAdjuntosPorIncidente(
  id_incidente: number
): Promise<AdjuntoRead[]> {

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/adjuntos/${id_incidente}`, { headers });

  if (!res.ok) {
    throw new Error("Error al obtener adjuntos");
  }

  return res.json();
}

export async function descargarAdjunto(id_adjunto: number): Promise<void> {
  const headers = await getAuthHeadersMultipart();

  const url = `${API_URL}/adjuntos/${id_adjunto}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error("Error al descargar adjunto");
  }

  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");

  let filename = "archivo";

  if (contentDisposition && contentDisposition.includes("filename=")) {
    filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function borrarAdjunto(id_adjunto: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/adjuntos/${id_adjunto}`, {
    method: "DELETE",
    headers
  });

  if (!res.ok) {
    throw new Error("Error al eliminar adjunto");
  }
}
