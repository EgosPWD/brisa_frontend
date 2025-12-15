<script lang="ts">
	import { onMount } from 'svelte';
    import './frecuentes.css'
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { CodigosFrecuentesResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<CodigosFrecuentesResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filtros
	let tipo = $state<'reconocimiento' | 'orientacion' | ''>('');
	let limit = $state(10);
	let fecha_desde = $state('');
	let fecha_hasta = $state('');

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			const params: any = { limit };
			if (tipo) params.tipo = tipo;
			if (fecha_desde) params.from = fecha_desde;
			if (fecha_hasta) params.to = fecha_hasta;

			reporte = await apiClient.getReporteCodigosFrecuentes(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		tipo = '';
		limit = 10;
		fecha_desde = '';
		fecha_hasta = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte || !reporte.codigos.length) return;

		const data = reporte.codigos.map(c => ({
			'Código': c.codigo,
			'Descripción': c.descripcion,
			'Tipo': c.tipo,
			'Total Aplicaciones': c.total_aplicaciones,
			'Porcentaje': c.porcentaje.toFixed(2) + '%'
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Códigos Frecuentes');
		XLSX.writeFile(workbook, `codigos_frecuentes_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.codigos.length) return;

		const headers = ['Código', 'Descripción', 'Tipo', 'Total Aplicaciones', 'Porcentaje'];
		const rows = reporte.codigos.map(c => [
			c.codigo,
			c.descripcion,
			c.tipo,
			c.total_aplicaciones,
			c.porcentaje.toFixed(2) + '%'
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `codigos_frecuentes_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}

	function getTipoBadgeStyle(tipoStr: string): string {
		return tipoStr === 'reconocimiento' 
			? 'background-color: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;'
			: 'background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block;';
	}
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('code')}</span>
				Códigos Más Frecuentes
			</h1>
			<p>Códigos de esquela más aplicados con estadísticas de uso</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick={cargarReporte} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span>
				Actualizar
			</button>
			<button class="btn btn-success" onclick={exportarExcel} disabled={!reporte || !reporte.codigos.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar Excel
			</button>
			<button class="btn btn-primary" onclick={exportarCSV} disabled={!reporte || !reporte.codigos.length}>
				<span class="icon">{@html getIconSvg('download')}</span>
				Exportar CSV
			</button>
		</div>
	</div>

	<!-- Filtros -->
	<div class="filters-card">
		<div class="filters-grid">
			<div class="filter-group">
				<label for="tipo">Tipo de Código</label>
				<select id="tipo" bind:value={tipo}>
					<option value="">Todos</option>
					<option value="reconocimiento">Reconocimiento</option>
					<option value="orientacion">Orientación</option>
				</select>
			</div>
			<div class="filter-group">
				<label for="limit">Cantidad a Mostrar</label>
				<input type="number" id="limit" bind:value={limit} min="1" max="50" />
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
			<p>Cargando códigos...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="icon">{@html getIconSvg('alert-circle')}</span>
			<p>{error}</p>
		</div>
	{:else if reporte}
		<div class="stats-row">
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('code')}</span>
				<div class="stat-info">
					<span class="stat-label">Códigos Únicos</span>
					<span class="stat-value">{reporte.total_codigos}</span>
				</div>
			</div>
			<div class="stat-card">
				<span class="stat-icon">{@html getIconSvg('clipboard-list')}</span>
				<div class="stat-info">
					<span class="stat-label">Total Aplicaciones</span>
					<span class="stat-value">{reporte.total_aplicaciones}</span>
				</div>
			</div>
		</div>

		<div class="table-card">
			<div class="table-header">
				<h2>
					<span class="icon">{@html getIconSvg('bar-chart')}</span>
					Ranking de Códigos
				</h2>
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Código</th>
							<th>Descripción</th>
							<th>Tipo</th>
							<th>Aplicaciones</th>
							<th>Porcentaje</th>
							<th>Distribución</th>
						</tr>
					</thead>
					<tbody>
						{#each reporte.codigos as codigo, index}
							<tr>
								<td class="rank">{index + 1}</td>
								<td class="codigo-cell">{codigo.codigo}</td>
								<td class="font-semibold">{codigo.descripcion}</td>
								<td>
									<span style="{getTipoBadgeStyle(codigo.tipo)}">
										{codigo.tipo.charAt(0).toUpperCase() + codigo.tipo.slice(1)}
									</span>
								</td>
								<td class="aplicaciones">{codigo.total_aplicaciones}</td>
								<td class="porcentaje">{codigo.porcentaje.toFixed(1)}%</td>
								<td>
									<div class="progress-bar">
										<div class="progress-fill" style="width: {codigo.porcentaje}%"></div>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="7" class="text-center text-muted">
									No se encontraron códigos aplicados
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

