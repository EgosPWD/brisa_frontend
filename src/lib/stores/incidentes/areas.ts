import { writable } from "svelte/store";
import type { Area } from "$lib/types/incidentes/areas";

export const listaAreas = writable<Area[]>([]);
