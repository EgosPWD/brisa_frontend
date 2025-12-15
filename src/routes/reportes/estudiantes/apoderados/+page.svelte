<script lang="ts">
    import './apoderados.css';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api';
	import type { EstudiantesApoderadosResponseDTO } from '$lib/types/api';
	import { getIconSvg } from '$lib/components/svg';
	import * as XLSX from 'xlsx';

	let loading = false;
	let error: string | null = null;
	let reporte: EstudiantesApoderadosResponseDTO | null = null;

	// Filtro
	let filtroApoderados: 'todos' | 'con' | 'sin' = 'todos';

	async function cargarReporte() {
		loading = true;
		error = null;
		
		try {
			let conApoderados: boolean | undefined;
			if (filtroApoderados === 'con') conApoderados = true;
			else if (filtroApoderados === 'sin') conApoderados = false;

			reporte = await apiClient.getReporteEstudiantesApoderados(conApoderados);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function exportarExcel() {
		if (!reporte) return;

		const data = reporte.estudiantes.map(est => {
			const padre = est.apoderados.find(a => a.tipo === 'padre');
			const madre = est.apoderados.find(a => a.tipo === 'madre');
			return {
				'ID': est.id_estudiante,
				'CI': est.ci,
				'Nombre Completo': est.nombre_completo,
				'Tiene Apoderados': est.tiene_apoderados ? 'Sí' : 'No',
				'Nombre Padre': padre?.nombre_completo || '-',
				'Teléfono Padre': padre?.telefono || '-',
				'Nombre Madre': madre?.nombre_completo || '-',
				'Teléfono Madre': madre?.telefono || '-'
			};
		});

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Apoderados');
		XLSX.writeFile(workbook, `estudiantes_apoderados_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte) return;

		const headers = ['ID', 'CI', 'Nombre Completo', 'Tiene Apoderados', 'Nombre Padre', 'Teléfono Padre', 'Nombre Madre', 'Teléfono Madre'];
		const rows = reporte.estudiantes.map(est => {
			const padre = est.apoderados.find(a => a.tipo === 'padre');
			const madre = est.apoderados.find(a => a.tipo === 'madre');
			return [
				est.id_estudiante,
				est.ci,
				est.nombre_completo,
				est.tiene_apoderados ? 'Sí' : 'No',
				padre?.nombre_completo || '-',
				padre?.telefono || '-',
				madre?.nombre_completo || '-',
				madre?.telefono || '-'
			];
		});

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.map(cell => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `estudiantes_apoderados_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onMount(() => {
		cargarReporte();
	});
</script>

<div class="reporte-container">
	<div class="reporte-header">
		<h2><span class="icon">{@html getIconSvg('users')}</span> Reporte de Apoderados</h2>
		<p>Estudiantes con o sin apoderados (padre/madre) registrados</p>
	</div>

	<div class="filtros-section">
		<div class="filter-options">
			<label class="radio-label">
				<input type="radio" bind:group={filtroApoderados} value="todos" on:change={cargarReporte} />
				<span>Todos los estudiantes</span>
			</label>
			<label class="radio-label">
				<input type="radio" bind:group={filtroApoderados} value="con" on:change={cargarReporte} />
				<span>Solo con apoderados</span>
			</label>
			<label class="radio-label">
				<input type="radio" bind:group={filtroApoderados} value="sin" on:change={cargarReporte} />
				<span>Solo sin apoderados</span>
			</label>
		</div>
	</div>

	{#if error}
		<div class="error-message">
			<span class="icon">{@html getIconSvg('alert-triangle')}</span> {error}
		</div>
	{/if}

	{#if loading}
		<div class="loading-spinner">
			<div class="spinner"></div>
			<p>Cargando reporte...</p>
		</div>
	{:else if reporte}
		<div class="estadisticas">
			<div class="stat-card">
				<div class="stat-icon">{@html getIconSvg('users')}</div>
				<div class="stat-content">
					<span class="stat-value">{reporte.total}</span>
					<span class="stat-label">Total Estudiantes</span>
				</div>
			</div>
			<div class="stat-card success">
				<div class="stat-icon">{@html getIconSvg('check-circle')}</div>
				<div class="stat-content">
					<span class="stat-value">{reporte.estudiantes.filter(e => e.tiene_apoderados).length}</span>
					<span class="stat-label">Con Apoderados</span>
				</div>
			</div>
			<div class="stat-card warning">
				<div class="stat-icon">{@html getIconSvg('alert-triangle')}</div>
				<div class="stat-content">
					<span class="stat-value">{reporte.estudiantes.filter(e => !e.tiene_apoderados).length}</span>
					<span class="stat-label">Sin Apoderados</span>
				</div>
			</div>
			<div class="stat-card info">
				<div class="stat-icon">{@html getIconSvg('bar-chart')}</div>
				<div class="stat-content">
					<span class="stat-value">
						{reporte.total > 0 ? Math.round((reporte.estudiantes.filter(e => e.tiene_apoderados).length / reporte.total) * 100) : 0}%
					</span>
					<span class="stat-label">Cobertura</span>
				</div>
			</div>
		</div>

		<div class="resultados-section">
			<div class="resultados-header">
				<h3>Listado Detallado</h3>
				<div style="display: flex; gap: 0.5rem;">
					<button 
						class="btn btn-success" 
						on:click={exportarExcel}
						disabled={!reporte.estudiantes.length}
					>
						<span class="icon">{@html getIconSvg('download')}</span> Exportar Excel
					</button>
					<button 
						class="btn btn-export" 
						on:click={exportarCSV}
						disabled={!reporte.estudiantes.length}
					>
						<span class="icon">{@html getIconSvg('download')}</span> Exportar CSV
					</button>
				</div>
			</div>

			{#if reporte.estudiantes.length === 0}
				<div class="empty-state">
					<p>No se encontraron estudiantes con los filtros aplicados</p>
				</div>
			{:else}
				<div class="table-container">
					<table class="estudiantes-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>CI</th>
								<th>Nombres Completos</th>
								<th>Nombre Padre</th>
								<th>Teléfono Padre</th>
								<th>Nombre Madre</th>
								<th>Teléfono Madre</th>
								<th>Estado</th>
							</tr>
						</thead>
						<tbody>
						{#each reporte.estudiantes as estudiante}
							{@const padre = estudiante.apoderados.find(a => a.tipo === 'padre')}
							{@const madre = estudiante.apoderados.find(a => a.tipo === 'madre')}
							<tr>
								<td>{estudiante.id_estudiante}</td>
								<td>{estudiante.ci}</td>
								<td class="nombre-completo">
									{estudiante.nombre_completo}
								</td>
								<td>
									{#if padre}
										{padre.nombre_completo}
									{:else}
										<span class="status-badge danger">✗ No registrado</span>
									{/if}
								</td>
								<td>
									{#if padre}
										<a href="tel:{padre.telefono}" class="telefono-link">
											<span class="icon">{@html getIconSvg('smartphone')}</span> {padre.telefono}
										</a>
									{:else}
										-
									{/if}
								</td>
								<td>
									{#if madre}
										{madre.nombre_completo}
									{:else}
										<span class="status-badge danger">✗ No registrado</span>
									{/if}
								</td>
								<td>
									{#if madre}
										<a href="tel:{madre.telefono}" class="telefono-link">
											<span class="icon">{@html getIconSvg('smartphone')}</span> {madre.telefono}
										</a>
									{:else}
										-
									{/if}
								</td>
								<td>
									{#if padre && madre}
										<span class="overall-badge complete">Completo</span>
									{:else if padre || madre}
										<span class="overall-badge partial">Parcial</span>
									{:else}
										<span class="overall-badge incomplete">Sin datos</span>
									{/if}
								</td>
							</tr>
						{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>

</style>
