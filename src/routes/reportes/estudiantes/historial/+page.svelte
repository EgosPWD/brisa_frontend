<script lang="ts">
    import './historial.css';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api';
	import type { HistorialCursosResponseDTO, EstudianteHistorialItem } from '$lib/types/api';
	import { getIconSvg } from '$lib/components/svg';
	import * as XLSX from 'xlsx';

	let loading = false;
	let error: string | null = null;
	let reporte: HistorialCursosResponseDTO | null = null;

	// Filtro
	let estudianteId: number | undefined = undefined;

	// Para búsqueda/filtrado en el frontend
	let searchTerm: string = '';
	let filteredEstudiantes: EstudianteHistorialItem[] = [];

	async function cargarReporte() {
		loading = true;
		error = null;
		
		try {
			reporte = await apiClient.getReporteHistorialCursos(estudianteId);
			filteredEstudiantes = reporte?.historiales || [];
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function buscarEstudiante() {
		if (!reporte) return;
		
		if (!searchTerm.trim()) {
			filteredEstudiantes = reporte.historiales;
			return;
		}

		const term = searchTerm.toLowerCase();
		filteredEstudiantes = reporte.historiales.filter(est => {
			const nombreCompleto = est.nombre_completo.toLowerCase();
			const ci = est.ci.toLowerCase();
			return nombreCompleto.includes(term) || ci.includes(term);
		});
	}

	function limpiarFiltro() {
		estudianteId = undefined;
		searchTerm = '';
		cargarReporte();
	}

	function exportarExcel() {
		if (!reporte) return;

		const data: any[] = [];
		
		filteredEstudiantes.forEach(est => {
			if (est.cursos.length > 0) {
				est.cursos.forEach(curso => {
					data.push({
						'ID Estudiante': est.id_estudiante,
						'CI': est.ci,
						'Nombre Completo': est.nombre_completo,
						'ID Curso': curso.id_curso,
						'Nombre Curso': curso.nombre_curso,
						'Nivel': curso.nivel,
						'Gestión': curso.gestion,
						'Total Cursos': est.total_cursos
					});
				});
			} else {
				data.push({
					'ID Estudiante': est.id_estudiante,
					'CI': est.ci,
					'Nombre Completo': est.nombre_completo,
					'ID Curso': '-',
					'Nombre Curso': '-',
					'Nivel': '-',
					'Gestión': '-',
					'Total Cursos': 0
				});
			}
		});

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
		XLSX.writeFile(workbook, `historial_cursos_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte) return;

		const rows: string[][] = [];
		
		// Headers
		rows.push(['ID Estudiante', 'CI', 'Nombre Completo', 'ID Curso', 'Nombre Curso', 'Nivel', 'Gestión', 'Total Cursos']);

		// Data
		filteredEstudiantes.forEach(est => {
			if (est.cursos.length > 0) {
				est.cursos.forEach(curso => {
					rows.push([
						est.id_estudiante.toString(),
						est.ci,
						est.nombre_completo,
						curso.id_curso.toString(),
						curso.nombre_curso,
						curso.nivel,
						curso.gestion,
						est.total_cursos.toString()
					]);
				});
			} else {
				// Estudiante sin cursos
				rows.push([
					est.id_estudiante.toString(),
					est.ci,
					est.nombre_completo,
					'-',
					'-',
					'-',
					'-',
					'0'
				]);
			}
		});

		const csvContent = rows.map(row => 
			row.map(cell => `"${cell}"`).join(',')
		).join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `historial_cursos_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	$: {
		searchTerm;
		if (reporte) buscarEstudiante();
	}

	onMount(() => {
		cargarReporte();
	});
</script>

<div class="reporte-container">
	<div class="reporte-header">
		<h2><span class="icon">{@html getIconSvg('book')}</span> Historial de Cursos</h2>
		<p>Trayectoria académica de estudiantes por gestión</p>
	</div>

	<div class="filtros-section">
		<div class="filtros-grid">
			<div class="form-group">
				<label for="estudiante">ID Estudiante (opcional)</label>
				<input 
					type="number" 
					id="estudiante"
					bind:value={estudianteId}
					placeholder="Dejar vacío para ver todos"
				/>
			</div>

			<div class="form-group">
				<label for="search">Buscar por nombre o CI</label>
				<input 
					type="text" 
					id="search"
					bind:value={searchTerm}
					placeholder="Ej: Juan Pérez o 12345678"
					disabled={!reporte}
				/>
			</div>
		</div>

		<div class="filtros-actions">
			<button class="btn btn-primary" on:click={cargarReporte} disabled={loading}>
				{#if loading}
					<span class="icon">{@html getIconSvg('clock')}</span> Cargando...
				{:else}
					<span class="icon">{@html getIconSvg('search')}</span> Consultar
				{/if}
			</button>
			<button class="btn btn-secondary" on:click={limpiarFiltro} disabled={loading}>
				<span class="icon">{@html getIconSvg('refresh')}</span> Limpiar
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
			<p>Cargando historial...</p>
		</div>
	{:else if reporte}
		<div class="resultados-section">
			<div class="resultados-header">
			<div class="resultados-info">
				<h3>
					Historial de {reporte.total_estudiantes} estudiante{reporte.total_estudiantes !== 1 ? 's' : ''}
				</h3>
				{#if searchTerm}
					<p class="filtros-aplicados">
						Mostrando {filteredEstudiantes.length} resultado{filteredEstudiantes.length !== 1 ? 's' : ''} para: "{searchTerm}"
					</p>
				{/if}
</div>				<div style="display: flex; gap: 0.5rem;">
				<button 
					class="btn btn-success" 
					on:click={exportarExcel}
					disabled={!filteredEstudiantes.length}
				>
					<span class="icon">{@html getIconSvg('download')}</span> Exportar Excel
				</button>
				<button 
					class="btn btn-export" 
					on:click={exportarCSV}
					disabled={!filteredEstudiantes.length}
				>
					<span class="icon">{@html getIconSvg('download')}</span> Exportar CSV
				</button>
			</div>
			</div>

			{#if filteredEstudiantes.length === 0}
				<div class="empty-state">
					<p>
						{#if searchTerm}
							No se encontraron estudiantes que coincidan con "{searchTerm}"
						{:else}
							No hay historial de cursos disponible
						{/if}
					</p>
				</div>
			{:else}
				<div class="estudiantes-list">
					{#each filteredEstudiantes as estudiante}
					<div class="estudiante-card">
						<div class="estudiante-header">
							<div class="estudiante-info">
								<h4>{estudiante.nombre_completo}</h4>
						<div class="estudiante-meta">
							<span class="badge badge-id">ID: {estudiante.id_estudiante}</span>
							<span class="badge badge-ci">CI: {estudiante.ci}</span>
							<span class="badge badge-count">
								{estudiante.total_cursos} curso{estudiante.total_cursos !== 1 ? 's' : ''}
							</span>
						</div>
								</div>
							</div>

							{#if estudiante.cursos.length === 0}
								<p class="no-cursos">Sin cursos registrados</p>
							{:else}
								<div class="cursos-timeline">
									{#each estudiante.cursos as curso}
										<div class="curso-item">
											<div class="curso-gestion">
												<span class="gestion-badge">{curso.gestion}</span>
											</div>
							<div class="curso-details">
								<div class="curso-nombre">{curso.nombre_curso}</div>
								<div class="curso-meta">
									<span class="nivel-badge nivel-{curso.nivel}">{curso.nivel}</span>
									<span class="texto-detalle">ID Curso: {curso.id_curso}</span>
								</div>
							</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>


