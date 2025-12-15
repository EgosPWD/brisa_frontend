<script lang="ts">
	import { onMount } from 'svelte';
    import './fecha.css'
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { EsquelasPorFechaResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<EsquelasPorFechaResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filtros
	let fecha_desde = $state('');
	let fecha_hasta = $state('');
	let tipo = $state<'reconocimiento' | 'orientacion' | ''>('');

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			const params: any = {};
			if (fecha_desde) params.from = fecha_desde;
			if (fecha_hasta) params.to = fecha_hasta;
			if (tipo) params.tipo = tipo;

			reporte = await apiClient.getReporteEsquelasPorFecha(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		fecha_desde = '';
		fecha_hasta = '';
		tipo = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte || !reporte.esquelas.length) return;

		const data = reporte.esquelas.map(e => ({
			'ID': e.id_esquela,
			'Fecha': e.fecha,
			'Estudiante': e.estudiante_nombre,
			'CI Estudiante': e.estudiante_ci,
			'Profesor': e.profesor_nombre,
			'Registrador': e.registrador_nombre,
			'Códigos': e.codigos.join('; '),
			'Observaciones': e.observaciones || ''
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Por Fecha');
		XLSX.writeFile(workbook, `esquelas_por_fecha_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.esquelas.length) return;

		const headers = ['ID', 'Fecha', 'Estudiante', 'CI Estudiante', 'Profesor', 'Registrador', 'Códigos', 'Observaciones'];
		const rows = reporte.esquelas.map(e => [
			e.id_esquela,
			e.fecha,
			e.estudiante_nombre,
			e.estudiante_ci,
			e.profesor_nombre,
			e.registrador_nombre,
			e.codigos.join('; '),
			e.observaciones || ''
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `esquelas_por_fecha_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('calendar')}</span>
				Esquelas por Rango de Fechas
			</h1>
			<p>Consulta esquelas emitidas en un período específico</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick={cargarReporte} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span>
				Actualizar
			</button>
			<button class="btn btn-success" onclick={exportarExcel} disabled={!reporte || !reporte.esquelas.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar Excel
			</button>
			<button class="btn btn-primary" onclick={exportarCSV} disabled={!reporte || !reporte.esquelas.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar CSV
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="fecha_desde">Fecha Desde</label>
				<input type="date" id="fecha_desde" bind:value={fecha_desde} />
			</div>
			<div class="filter-group">
				<label for="fecha_hasta">Fecha Hasta</label>
				<input type="date" id="fecha_hasta" bind:value={fecha_hasta} />
			</div>
			<div class="filter-group">
				<label for="tipo">Tipo de Esquela</label>
				<select id="tipo" bind:value={tipo}>
					<option value="">Todos</option>
					<option value="reconocimiento">Reconocimiento</option>
					<option value="orientacion">Orientación</option>
				</select>
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
			<p>Cargando esquelas...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="icon">{@html getIconSvg('alert-circle')}</span>
			<p>{error}</p>
		</div>
	{:else if reporte}
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('bar-chart')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Esquelas</span>
					<span class="stat-value">{reporte.total}</span>
				</div>
			</div>
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('trophy')}</span>
				<div class="stat-info">
					<span class="stat-label">Reconocimientos</span>
					<span class="stat-value">{reporte.reconocimientos}</span>
				</div>
			</div>
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('clipboard-list')}</span>
				<div class="stat-info">
					<span class="stat-label">Orientaciones</span>
					<span class="stat-value">{reporte.orientaciones}</span>
				</div>
			</div>
		</div>

		<div class="table-card">
			<div class="table-header">
				<h2>
					<span class="icon">{@html getIconSvg('clipboard-list')}</span>
					Listado de Esquelas
				</h2>
				{#if reporte.fecha_desde || reporte.fecha_hasta}
					<p class="date-range">
						{#if reporte.fecha_desde && reporte.fecha_hasta}
							Desde {reporte.fecha_desde} hasta {reporte.fecha_hasta}
						{:else if reporte.fecha_desde}
							Desde {reporte.fecha_desde}
						{:else}
							Hasta {reporte.fecha_hasta}
						{/if}
					</p>
				{/if}
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Fecha</th>
							<th>Estudiante</th>
							<th>CI</th>
							<th>Profesor Emisor</th>
							<th>Registrador</th>
							<th>Códigos</th>
							<th>Observaciones</th>
						</tr>
					</thead>
					<tbody>
						{#each reporte.esquelas as esquela}
							<tr>
								<td>{esquela.id_esquela}</td>
								<td>{esquela.fecha}</td>
								<td class="font-semibold">{esquela.estudiante_nombre}</td>
								<td>{esquela.estudiante_ci}</td>
								<td>{esquela.profesor_nombre}</td>
								<td>{esquela.registrador_nombre}</td>
								<td>
									<div class="codigos-list">
										{#each esquela.codigos as codigo}
											<span class="codigo-tag">{codigo}</span>
										{/each}
									</div>
								</td>
								<td class="observaciones">{esquela.observaciones || '—'}</td>
							</tr>
						{:else}
							<tr>
								<td colspan="8" class="text-center text-muted">
									No se encontraron esquelas para el período seleccionado
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

