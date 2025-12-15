<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { ProfesoresAsignadosResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<ProfesoresAsignadosResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filtros
	let curso_id = $state<number | undefined>(undefined);
	let materia_id = $state<number | undefined>(undefined);
	let nivel = $state<'inicial' | 'primaria' | 'secundaria' | ''>('');
	let gestion = $state('');

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			const params: any = {};
			if (curso_id) params.curso_id = curso_id;
			if (materia_id) params.materia_id = materia_id;
			if (nivel) params.nivel = nivel;
			if (gestion) params.gestion = gestion;

			reporte = await apiClient.getReporteProfesoresAsignados(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		curso_id = undefined;
		materia_id = undefined;
		nivel = '';
		gestion = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte || !reporte.profesores.length) return;

		const data = reporte.profesores.map(p => ({
			'ID': p.id_profesor,
			'CI': p.ci,
			'Nombre Completo': p.nombre_completo,
			'Teléfono': p.telefono || '',
			'Correo': p.correo || '',
			'Curso': p.curso,
			'Materia': p.materia
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Profesores');
		XLSX.writeFile(workbook, `profesores_asignados_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.profesores.length) return;

		const headers = ['ID', 'CI', 'Nombre Completo', 'Teléfono', 'Correo', 'Curso', 'Materia'];
		const rows = reporte.profesores.map(p => [
			p.id_profesor,
			p.ci,
			p.nombre_completo,
			p.telefono || '',
			p.correo || '',
			p.curso,
			p.materia
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `profesores_asignados_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('user-check')}</span>
				Profesores Asignados
			</h1>
			<p>Listado de profesores asignados por curso y materia</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick={cargarReporte} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span>
				Actualizar
			</button>
			<button class="btn btn-success" onclick={exportarExcel} disabled={!reporte || !reporte.profesores.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar Excel
			</button>
			<button class="btn btn-primary" onclick={exportarCSV} disabled={!reporte || !reporte.profesores.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar CSV
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="curso_id">ID Curso</label>
				<input 
					type="number" 
					id="curso_id" 
					bind:value={curso_id}
					placeholder="Ej: 5"
				/>
			</div>
			<div class="filter-group">
				<label for="materia_id">ID Materia</label>
				<input 
					type="number" 
					id="materia_id" 
					bind:value={materia_id}
					placeholder="Ej: 3"
				/>
			</div>
			<div class="filter-group">
				<label for="nivel">Nivel</label>
				<select id="nivel" bind:value={nivel}>
					<option value="">Todos</option>
					<option value="inicial">Inicial</option>
					<option value="primaria">Primaria</option>
					<option value="secundaria">Secundaria</option>
				</select>
			</div>
			<div class="filter-group">
				<label for="gestion">Gestión</label>
				<input 
					type="text" 
					id="gestion" 
					bind:value={gestion}
					placeholder="Ej: 2024"
				/>
			</div>
		</div>
		<div class="filter-actions">
			<button class="btn btn-primary" onclick={cargarReporte}>
				<span class="icon">{@html getIconSvg('search')}</span>
				Buscar
			</button>
			<button class="btn btn-secondary" onclick={limpiarFiltros}>
				Limpiar
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Cargando profesores...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="icon">{@html getIconSvg('alert-circle')}</span>
			<p>{error}</p>
		</div>
	{:else if reporte}
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('user-check')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Profesores</span>
					<span class="stat-value">{reporte.total}</span>
				</div>
			</div>
			{#if reporte.curso}
				<div class="stat-card">
					<span class="stat-icon">{@html getIconSvg('book-open')}</span>
					<div class="stat-info">
						<span class="stat-label">Curso</span>
						<span class="stat-value">{reporte.curso}</span>
					</div>
				</div>
			{/if}
			{#if reporte.materia}
				<div class="stat-card">
					<span class="stat-icon">{@html getIconSvg('book')}</span>
					<div class="stat-info">
						<span class="stat-label">Materia</span>
						<span class="stat-value">{reporte.materia}</span>
					</div>
				</div>
			{/if}
		</div>

		<div class="table-card">
			<div class="table-header">
				<h2>
					<span class="icon">{@html getIconSvg('user-check')}</span>
					Listado de Profesores
				</h2>
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>CI</th>
							<th>Nombre Completo</th>
							<th>Teléfono</th>
							<th>Correo</th>
							<th>Curso</th>
							<th>Materia</th>
						</tr>
					</thead>
					<tbody>
						{#each reporte.profesores as profesor}
							<tr>
								<td>{profesor.id_profesor}</td>
								<td>{profesor.ci}</td>
								<td class="font-semibold">{profesor.nombre_completo}</td>
								<td>
									{#if profesor.telefono}
										<a href="tel:{profesor.telefono}" class="telefono-link">
											<span class="icon">{@html getIconSvg('phone')}</span>
											{profesor.telefono}
										</a>
									{:else}
										<span class="text-muted">—</span>
									{/if}
								</td>
								<td>
									{#if profesor.correo}
										<a href="mailto:{profesor.correo}">{profesor.correo}</a>
									{:else}
										<span class="text-muted">—</span>
									{/if}
								</td>
								<td>
									<span style="background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;">
										{profesor.curso}
									</span>
								</td>
								<td>{profesor.materia}</td>
							</tr>
						{:else}
							<tr>
								<td colspan="7" class="text-center text-muted">
									No se encontraron profesores asignados
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
	@import './profesores.css';
</style>
