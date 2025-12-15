<script lang="ts">
	import { onMount } from 'svelte';
	import './emisor.css'
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { EsquelasPorProfesorResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<EsquelasPorProfesorResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filtros
	let profesor_id = $state<number | undefined>(undefined);
	let fecha_desde = $state('');
	let fecha_hasta = $state('');
	let profesorExpandido = $state<number | null>(null);

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			const params: any = {};
			if (profesor_id) params.profesor_id = profesor_id;
			if (fecha_desde) params.from = fecha_desde;
			if (fecha_hasta) params.to = fecha_hasta;

			reporte = await apiClient.getReporteEsquelasPorProfesor(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		profesor_id = undefined;
		fecha_desde = '';
		fecha_hasta = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte || !reporte.profesores.length) return;

		const data = reporte.profesores.map(p => ({
			'Emisor ID': p.id_profesor,
			'Emisor': p.profesor_nombre,
			'CI': p.profesor_ci,
			'Total Esquelas': p.total_esquelas,
			'Reconocimientos': p.reconocimientos,
			'Orientaciones': p.orientaciones
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Por Emisor');
		XLSX.writeFile(workbook, `esquelas_por_emisor_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.profesores.length) return;

		const headers = ['Emisor ID', 'Emisor', 'CI', 'Total Esquelas', 'Reconocimientos', 'Orientaciones'];
		const rows = reporte.profesores.map(p => [
			p.id_profesor,
			p.profesor_nombre,
			p.profesor_ci,
			p.total_esquelas,
			p.reconocimientos,
			p.orientaciones
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `esquelas_por_emisor_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}

	function toggleProfesor(id: number) {
		profesorExpandido = profesorExpandido === id ? null : id;
	}
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('user-check')}</span>
				Esquelas por Emisor
			</h1>
			<p>Esquelas emitidas por cada Emisor con totales de reconocimientos y orientaciones</p>
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
				<label for="profesor_id">CI Asignador</label>
				<input type="number" id="profesor_id" bind:value={profesor_id} placeholder="Todos los Emisores" />
			</div>
			<div class="filter-group">
				<label for="fecha_desde">Fecha Desde</label>
				<input type="date" id="fecha_desde" bind:value={fecha_desde} />
			</div>
			<div class="filter-group">
				<label for="fecha_hasta">Fecha Hasta</label>
				<input type="date" id="fecha_hasta" bind:value={fecha_hasta} />
			</div>
		</div>
		<div class="filter-actions">
			<button class="btn btn-secondary" onclick={limpiarFiltros}>
				Limpiar Filtros
			</button>
			<button class="btn btn-primary" onclick={cargarReporte}>
				Aplicar Filtros
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Cargando reporte...</p>
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
					<span class="stat-label">Total Emisores</span>
					<span class="stat-value">{reporte.total_profesores}</span>
				</div>
			</div>
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('clipboard-list')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Esquelas</span>
					<span class="stat-value">{reporte.total_esquelas}</span>
				</div>
			</div>
		</div>

		<div class="table-card">
			<div class="table-header">
				<h2>
					<span class="icon">{@html getIconSvg('user-check')}</span>
					Emisores y sus Esquelas
				</h2>
			</div>
			<div class="table-container">
				{#each reporte.profesores as profesor}
					<div class="profesor-card">
						<div class="profesor-header" onclick={() => toggleProfesor(profesor.id_profesor)}>
							<div class="profesor-info">
								<h3>{profesor.profesor_nombre}</h3>
								<p>CI: {profesor.profesor_ci}</p>
							</div>
							<div class="profesor-stats">
								<span style="background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block; margin-right: 0.5rem;">
									Total: {profesor.total_esquelas}
								</span>
								<span style="background-color: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block; margin-right: 0.5rem;">
									R: {profesor.reconocimientos}
								</span>
								<span style="background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;">
									O: {profesor.orientaciones}
								</span>
								<span class="expand-icon" style="margin-left: 1rem;">
									{@html getIconSvg(profesorExpandido === profesor.id_profesor ? 'chevron-down' : 'chevron-right')}
								</span>
							</div>
						</div>
						
						{#if profesorExpandido === profesor.id_profesor}
							<div class="esquelas-list">
								<table>
									<thead>
										<tr>
											<th>ID</th>
											<th>Fecha</th>
											<th>Estudiante</th>
											<th>CI Estudiante</th>
											<th>Códigos</th>
											<th>Observaciones</th>
										</tr>
									</thead>
									<tbody>
										{#each profesor.esquelas as esquela}
											<tr>
												<td>{esquela.id_esquela}</td>
												<td>{esquela.fecha}</td>
												<td>{esquela.estudiante_nombre}</td>
												<td>{esquela.estudiante_ci}</td>
												<td>
													<div class="codigos-list">
														{#each esquela.codigos as codigo}
															<span class="codigo-tag">{codigo}</span>
														{/each}
													</div>
												</td>
												<td>{esquela.observaciones || '—'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				{:else}
					<p class="text-center text-muted">No se encontraron Emisores con esquelas</p>
				{/each}
			</div>
		</div>
	{/if}
</div>
