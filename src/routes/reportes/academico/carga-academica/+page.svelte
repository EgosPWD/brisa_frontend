<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api.js';
	import { getIconSvg } from '$lib/components/svg.js';
	import type { CargaAcademicaResponseDTO } from '$lib/types/api.js';
	import * as XLSX from 'xlsx';

	let reporte = $state<CargaAcademicaResponseDTO | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let profesor_id = $state<number | undefined>(undefined);
	let gestion = $state('');
	let expandedProfesores = $state<Set<number>>(new Set());

	onMount(() => {
		cargarReporte();
	});

	async function cargarReporte() {
		try {
			loading = true;
			error = null;
			const params: any = {};
			if (profesor_id) params.profesor_id = profesor_id;
			if (gestion) params.gestion = gestion;

			reporte = await apiClient.getReporteCargaAcademica(params);
		} catch (err: any) {
			error = err.message || 'Error al cargar el reporte';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	function limpiarFiltros() {
		profesor_id = undefined;
		gestion = '';
		cargarReporte();
	}

	function toggleProfesor(id: number) {
		const newSet = new Set(expandedProfesores);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		expandedProfesores = newSet;
	}

	function exportarExcel() {
		if (!reporte || !reporte.profesores.length) return;

		const data = reporte.profesores.map(p => ({
			'ID Profesor': p.id_profesor,
			'CI': p.ci,
			'Nombre Completo': p.nombre_completo,
			'Teléfono': p.telefono || '',
			'Correo': p.correo || '',
			'Total Asignaciones': p.total_asignaciones,
			'Cursos Distintos': p.cursos_distintos,
			'Materias Distintas': p.materias_distintas
		}));

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Carga Académica');
		XLSX.writeFile(workbook, `carga_academica_${new Date().toISOString().split('T')[0]}.xlsx`);
	}

	function exportarCSV() {
		if (!reporte || !reporte.profesores.length) return;

		const headers = ['ID Profesor', 'CI', 'Nombre Completo', 'Teléfono', 'Correo', 'Total Asignaciones', 'Cursos Distintos', 'Materias Distintas'];
		const rows = reporte.profesores.map(p => [
			p.id_profesor,
			p.ci,
			p.nombre_completo,
			p.telefono || '',
			p.correo || '',
			p.total_asignaciones,
			p.cursos_distintos,
			p.materias_distintas
		]);

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `carga_academica_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
	}
</script>

<div class="page-container">
	<div class="page-header">
		<div class="header-content">
			<h1>
				<span class="icon">{@html getIconSvg('briefcase')}</span>
				Carga Académica
			</h1>
			<p>Asignaciones de cursos y materias por profesor</p>
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
				<label for="profesor_id">ID Profesor</label>
				<input 
					type="number" 
					id="profesor_id" 
					bind:value={profesor_id}
					placeholder="Ej: 10"
				/>
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
			<p>Cargando carga académica...</p>
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
					<span class="stat-value">{reporte.total_profesores}</span>
				</div>
			</div>
		</div>

		<div class="table-card">
			<div class="table-header">
				<h2>
					<span class="icon">{@html getIconSvg('briefcase')}</span>
					Carga por Profesor
				</h2>
			</div>
			<div class="table-container">
				<table>
					<thead>
						<tr>
							<th style="width: 40px;"></th>
							<th>Profesor</th>
							<th>CI</th>
							<th>Teléfono</th>
							<th>Correo</th>
							<th class="text-center">Total Asignaciones</th>
							<th class="text-center">Cursos</th>
							<th class="text-center">Materias</th>
						</tr>
					</thead>
					<tbody>
						{#each reporte.profesores as profesor}
							<tr>
								<td>
									<button 
										class="expand-btn"
										onclick={() => toggleProfesor(profesor.id_profesor)}
										title={expandedProfesores.has(profesor.id_profesor) ? 'Contraer' : 'Expandir'}
									>
										{@html getIconSvg(expandedProfesores.has(profesor.id_profesor) ? 'chevron-down' : 'chevron-right')}
									</button>
								</td>
								<td class="font-semibold">{profesor.nombre_completo}</td>
								<td>{profesor.ci}</td>
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
								<td class="text-center">
									<span class="badge badge-primary">{profesor.total_asignaciones}</span>
								</td>
								<td class="text-center">{profesor.cursos_distintos}</td>
								<td class="text-center">{profesor.materias_distintas}</td>
							</tr>
							{#if expandedProfesores.has(profesor.id_profesor)}
								<tr class="expanded-row">
									<td colspan="8">
										<div class="asignaciones-container">
											<h4>
												<span class="icon">{@html getIconSvg('clipboard-list')}</span>
												Asignaciones
											</h4>
											<div class="asignaciones-grid">
												{#each profesor.asignaciones as asignacion}
													<div class="asignacion-card">
														<div class="asignacion-header">
															<span class="icon">{@html getIconSvg('book-open')}</span>
															<strong>{asignacion.materia}</strong>
														</div>
														<div class="asignacion-details">
															<div class="detail-item">
																<span class="detail-label">Curso:</span>
																<span class="badge badge-secondary">{asignacion.curso}</span>
															</div>
															<div class="detail-item">
																<span class="detail-label">Nivel:</span>
																<span>{asignacion.nivel}</span>
															</div>
															<div class="detail-item">
																<span class="detail-label">Gestión:</span>
																<span>{asignacion.gestion}</span>
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{:else}
							<tr>
								<td colspan="8" class="text-center text-muted">
									No se encontraron profesores con carga académica
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
	@import './carga_academica.css';
</style>

