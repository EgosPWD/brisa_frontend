<script lang="ts">
    import './edades.css';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api';
	import type { DistribucionEdadResponseDTO, RangoEdadItem } from '$lib/types/api';
	import { getIconSvg } from '$lib/components/svg';
	import * as XLSX from 'xlsx';

	let loading = false;
	let error: string | null = null;
	let reporte: DistribucionEdadResponseDTO | null = null;

	// Filtros
	let cursoId: number | undefined = undefined;
	let nivel: 'inicial' | 'primaria' | 'secundaria' | '' = '';
	let gestion: string = '';

	// Cursos disponibles
	let cursos: any[] = [];
	let loadingCursos = false;

	async function cargarCursos() {
		loadingCursos = true;
		try {
			const data = await apiClient.getCourses();
			cursos = Array.isArray(data) ? data : [];
		} catch (err) {
			console.error('Error cargando cursos:', err);
			cursos = [];
		} finally {
			loadingCursos = false;
		}
	}

	async function cargarReporte() {
		loading = true;
		error = null;
		
		try {
			const params: any = {};
			if (cursoId) params.curso_id = cursoId;
			if (nivel) params.nivel = nivel;
			if (gestion) params.gestion = gestion;

			reporte = await apiClient.getReporteDistribucionEdad(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		cursoId = undefined;
		nivel = '';
		gestion = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte) return;

		const data = reporte.distribucion.map(item => ({
			'Rango de Edad': item.rango_edad,
			'Cantidad': item.cantidad,
			'Porcentaje': `${item.porcentaje}%`
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribución Etaria');
		XLSX.writeFile(workbook, `distribucion_edad_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte) return;

		const headers = ['Rango de Edad', 'Cantidad', 'Porcentaje'];
		const rows = reporte.distribucion.map(item => [
			item.rango_edad,
			item.cantidad,
			`${item.porcentaje}%`
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.map(cell => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `distribucion_edad_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function getBarWidth(porcentaje: number): string {
		return `${Math.min(porcentaje, 100)}%`;
	}

	function getBarColor(index: number): string {
		const colors = [
			'#3b82f6', // azul
			'#10b981', // verde
			'#f59e0b', // amarillo
			'#ef4444', // rojo
			'#8b5cf6', // morado
			'#ec4899', // rosa
			'#6b7280'  // gris
		];
		return colors[index % colors.length];
	}

	onMount(() => {
		cargarCursos();
		cargarReporte();
	});
</script>

<div class="reporte-container">
	<div class="reporte-header">
		<h2><span class="icon">{@html getIconSvg('bar-chart')}</span> Distribución Etaria</h2>
		<p>Análisis de estudiantes por rangos de edad</p>
	</div>

	<div class="filtros-section">
		<div class="filtros-grid">
			<div class="form-group">
				<label for="curso">Curso</label>
				<select id="curso" bind:value={cursoId} disabled={loadingCursos}>
					<option value={undefined}>Todos los cursos</option>
					{#each cursos as curso}
						<option value={curso.id_curso}>
							{curso.nombre_curso || `${curso.grado}° ${curso.paralelo} - ${curso.nivel}`}
						</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="nivel">Nivel Educativo</label>
				<select id="nivel" bind:value={nivel}>
					<option value="">Todos los niveles</option>
					<option value="inicial">Inicial</option>
					<option value="primaria">Primaria</option>
					<option value="secundaria">Secundaria</option>
				</select>
			</div>

			<div class="form-group">
				<label for="gestion">Gestión (Año)</label>
				<input 
					type="text" 
					id="gestion"
					bind:value={gestion}
					placeholder="Ej: 2024"
				/>
			</div>
		</div>

		<div class="filtros-actions">
			<button class="btn btn-primary" on:click={cargarReporte} disabled={loading}>
				{#if loading}
					<span class="icon">{@html getIconSvg('clock')}</span> Cargando...
				{:else}
					<span class="icon">{@html getIconSvg('search')}</span> Buscar
				{/if}
			</button>
			<button class="btn btn-secondary" on:click={limpiarFiltros} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span> Limpiar Filtros
			</button>
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
		<div class="resultados-section">
			<div class="resultados-header">
				<div class="resultados-info">
					<h3>Total Estudiantes: {reporte.total_estudiantes}</h3>
				</div>

<div style="display: flex; gap: 0.5rem;">
				<button 
					class="btn btn-success" 
					on:click={exportarExcel}
					disabled={!reporte.distribucion.length}
				>
					<span class="icon">{@html getIconSvg('download')}</span> Exportar Excel
				</button>
				<button 
					class="btn btn-export" 
					on:click={exportarCSV}
					disabled={!reporte.distribucion.length}
				>
					<span class="icon">{@html getIconSvg('download')}</span> Exportar CSV
				</button>
			</div>
			</div>

			{#if reporte.distribucion.length === 0}
				<div class="empty-state">
					<p>No hay datos de distribución disponibles</p>
				</div>
			{:else}
				<!-- Gráfico de barras -->
				<div class="chart-container">
					<h4>Distribución Visual</h4>
					<div class="chart">
						{#each reporte.distribucion as item, index}
							<div class="chart-row">
								<div class="chart-label">
									<span class="rango-text">{item.rango_edad}</span>
									<span class="cantidad-text">{item.cantidad} estudiante{item.cantidad !== 1 ? 's' : ''}</span>
								</div>
								<div class="chart-bar-container">
									<div 
										class="chart-bar" 
										style="width: {getBarWidth(item.porcentaje)}; background-color: {getBarColor(index)}"
									>
										<span class="bar-label">{item.porcentaje.toFixed(1)}%</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Tabla detallada -->
				<div class="table-container">
					<h4>Datos Detallados</h4>
					<table class="distribucion-table">
						<thead>
							<tr>
								<th>Rango de Edad</th>
								<th>Cantidad</th>
								<th>Porcentaje</th>
								<th>Visualización</th>
							</tr>
						</thead>
						<tbody>
							{#each reporte.distribucion as item, index}
							<tr>
								<td class="rango-edad">
									<span class="color-indicator" style="background-color: {getBarColor(index)}"></span>
									{item.rango_edad}
								</td>
									<td class="cantidad">{item.cantidad}</td>
									<td class="porcentaje">{item.porcentaje.toFixed(2)}%</td>
									<td class="visual">
										<div class="mini-bar-container">
											<div 
												class="mini-bar" 
												style="width: {getBarWidth(item.porcentaje)}; background-color: {getBarColor(index)}"
											></div>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr>
								<td><strong>Total</strong></td>
								<td><strong>{reporte.total_estudiantes}</strong></td>
								<td><strong>100%</strong></td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
