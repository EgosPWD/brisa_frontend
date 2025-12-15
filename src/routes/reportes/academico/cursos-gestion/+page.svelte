<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { CursosPorGestionResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<CursosPorGestionResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let gestion = $state('');
	let nivel = $state<'inicial' | 'primaria' | 'secundaria' | ''>('');

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			const params: any = {};
			if (gestion) params.gestion = gestion;
			if (nivel) params.nivel = nivel;

			reporte = await apiClient.getReporteCursosPorGestion(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		gestion = '';
		nivel = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte || !reporte.cursos.length) return;

		const data = reporte.cursos.map(c => ({
			'ID': c.id_curso,
			'Nombre Curso': c.nombre_curso,
			'Nivel': c.nivel,
			'Gestión': c.gestion,
			'Total Estudiantes': c.total_estudiantes
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Cursos');
		XLSX.writeFile(workbook, `cursos_por_gestion_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.cursos.length) return;

		const headers = ['ID', 'Nombre Curso', 'Nivel', 'Gestión', 'Total Estudiantes'];
		const rows = reporte.cursos.map(c => [
			c.id_curso,
			c.nombre_curso,
			c.nivel,
			c.gestion,
			c.total_estudiantes
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `cursos_por_gestion_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}

	function getNivelBadgeClass(nivelStr: string): string {
		switch (nivelStr.toLowerCase()) {
			case 'inicial': return 'badge-success';
			case 'primaria': return 'badge-warning';
			case 'secundaria': return 'badge-info';
			default: return 'badge-secondary';
		}
	}

	const totalEstudiantes = $derived(
		reporte ? reporte.cursos.reduce((sum, curso) => sum + curso.total_estudiantes, 0) : 0
	);
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('book-open')}</span>
				Cursos por Gestión
			</h1>
			<p>Listado de cursos con cantidad de estudiantes por gestión</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick={cargarReporte} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span>
				Actualizar
			</button>
			<button class="btn btn-success" onclick={exportarExcel} disabled={!reporte || !reporte.cursos.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar Excel
			</button>
			<button class="btn btn-primary" onclick={exportarCSV} disabled={!reporte || !reporte.cursos.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar CSV
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="gestion">Gestión</label>
				<input 
					type="text" 
					id="gestion" 
					bind:value={gestion}
					placeholder="Ej: 2024"
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
			<p>Cargando cursos...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="icon">{@html getIconSvg('alert-circle')}</span>
			<p>{error}</p>
		</div>
	{:else if reporte}
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('book-open')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Cursos</span>
					<span class="stat-value">{reporte.total}</span>
				</div>
			</div>
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('graduation-cap')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Estudiantes</span>
					<span class="stat-value">{totalEstudiantes}</span>
				</div>
			</div>
			{#if reporte.gestion}
				<div class="stat-card">
					<span class="stat-icon">{@html getIconSvg('calendar')}</span>
					<div class="stat-info">
						<span class="stat-label">Gestión</span>
						<span class="stat-value">{reporte.gestion}</span>
					</div>
				</div>
			{/if}
			{#if reporte.nivel}
				<div class="stat-card">
					<span class="stat-icon">{@html getIconSvg('trophy')}</span>
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
					<span class="icon">{@html getIconSvg('book-open')}</span>
					Listado de Cursos
				</h2>
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Nombre del Curso</th>
							<th>Nivel</th>
							<th>Gestión</th>
							<th class="text-center">Total Estudiantes</th>
						</tr>
					</thead>
					<tbody>
						{#each reporte.cursos as curso}
							<tr>
								<td>{curso.id_curso}</td>
								<td class="font-semibold">{curso.nombre_curso}</td>
								<td>
									<span class="badge {getNivelBadgeClass(curso.nivel)}">
										{curso.nivel.charAt(0).toUpperCase() + curso.nivel.slice(1)}
									</span>
								</td>
								<td>{curso.gestion}</td>
								<td class="text-center">
									<span class="badge badge-primary">{curso.total_estudiantes}</span>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center text-muted">
									No se encontraron cursos
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
	@import './curso_gestion.css';
</style>
