<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { MateriasPorNivelResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<MateriasPorNivelResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let nivel = $state<'inicial' | 'primaria' | 'secundaria' | ''>('');

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			reporte = await apiClient.getReporteMateriasPorNivel(nivel || undefined);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		nivel = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte || !reporte.materias.length) return;

		const data = reporte.materias.map(m => ({
			'ID': m.id_materia,
			'Nombre Materia': m.nombre_materia,
			'Nivel': m.nivel
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Materias');
		XLSX.writeFile(workbook, `materias_por_nivel_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.materias.length) return;

		const headers = ['ID', 'Nombre Materia', 'Nivel'];
		const rows = reporte.materias.map(m => [
			m.id_materia,
			m.nombre_materia,
			m.nivel
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `materias_por_nivel_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}

	function getNivelBadgeStyle(nivelStr: string): string {
		switch (nivelStr.toLowerCase()) {
			case 'inicial': 
				return 'background-color: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;';
			case 'primaria': 
				return 'background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;';
			case 'secundaria': 
				return 'background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;';
			default: 
				return 'background-color: #f3f4f6; color: #4b5563; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;';
		}
	}
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('book')}</span>
				Materias por Nivel
			</h1>
			<p>Listado de materias organizadas por nivel educativo</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick={cargarReporte} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span>
				Actualizar
			</button>
			<button class="btn btn-success" onclick={exportarExcel} disabled={!reporte || !reporte.materias.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar Excel
			</button>
			<button class="btn btn-primary" onclick={exportarCSV} disabled={!reporte || !reporte.materias.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar CSV
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="nivel">Nivel Educativo</label>
				<select id="nivel" bind:value={nivel} onchange={cargarReporte}>
					<option value="">Todos los niveles</option>
					<option value="inicial">Inicial</option>
					<option value="primaria">Primaria</option>
					<option value="secundaria">Secundaria</option>
				</select>
			</div>
		</div>
		<div class="filter-actions">
			<button class="btn btn-secondary" onclick={limpiarFiltros}>
				Limpiar Filtros
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Cargando materias...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="icon">{@html getIconSvg('alert-circle')}</span>
			<p>{error}</p>
		</div>
	{:else if reporte}
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('book')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Materias</span>
					<span class="stat-value">{reporte.total}</span>
				</div>
			</div>
			{#if reporte.nivel}
				<div class="stat-card">
					<span class="stat-icon">{@html getIconSvg('graduation-cap')}</span>
					<div class="stat-info">
						<span class="stat-label">Nivel</span>
						<span class="stat-value">{reporte.nivel.charAt(0).toUpperCase() + reporte.nivel.slice(1)}</span>
					</div>
				</div>
			{/if}
		</div>

		<div class="table-card">
			<div class="table-header">
				<h2>
					<span class="icon">{@html getIconSvg('book')}</span>
					Listado de Materias
				</h2>
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Nombre de la Materia</th>
							<th>Nivel Educativo</th>
						</tr>
					</thead>
					<tbody>
						{#each reporte.materias as materia, index}
							<tr>
								<td>{materia.id_materia}</td>
								<td class="font-semibold">{materia.nombre_materia}</td>
								<td>
									<span style="{getNivelBadgeStyle(materia.nivel)}">
										{materia.nivel.charAt(0).toUpperCase() + materia.nivel.slice(1)}
									</span>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="3" class="text-center text-muted">
									No se encontraron materias
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	@import '../../page.css';
	
	:global(.badge) {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		display: inline-block;
	}

	:global(.badge-success) {
		background-color: #d1fae5;
		color: #065f46;
	}

	:global(.badge-warning) {
		background-color: #fef3c7;
		color: #92400e;
	}

	:global(.badge-info) {
		background-color: #dbeafe;
		color: #1e40af;
	}

	:global(.badge-secondary) {
		background-color: #f3f4f6;
		color: #4b5563;
	}
</style>
