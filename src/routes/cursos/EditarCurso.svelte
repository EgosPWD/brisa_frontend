<script lang="ts">
	import { getIconSvg } from '$lib/components/svg.js';
	import { coursesService, type CursoResponse, type CursoUpdateDTO } from '$lib/services/courses';

	interface Props {
		curso: CursoResponse;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { curso, onClose, onSuccess }: Props = $props();

	let formData = $state<CursoUpdateDTO>({
		nombre: curso.nombre,
		gestion: curso.gestion,
		nivel_educativo: curso.nivel_educativo as 'Inicial' | 'Primaria' | 'Secundaria',
		capacidad_maxima: curso.capacidad_maxima
	});

	let isSubmitting = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';

		try {
			await coursesService.updateCurso(curso.id, formData);
			onSuccess();
			onClose();
		} catch (error: any) {
			errorMessage = error.message || 'Error al actualizar el curso';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<div class="modal-overlay" onclick={handleOverlayClick}>
	<div class="modal-content">
		<div class="modal-header">
			<h2>{@html getIconSvg('edit')} Editar Curso</h2>
			<button class="btn-close" onclick={onClose}>
				{@html getIconSvg('x')}
			</button>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="modal-body">
				{#if errorMessage}
					<div class="alert alert-error">
						{errorMessage}
					</div>
				{/if}

				<div class="form-section">
					<h3 class="section-title">Información del Curso</h3>
					<div class="form-grid">
						<div class="form-group full-width">
							<label for="nombre">
								Nombre del Curso <span class="required">*</span>
							</label>
							<input
								type="text"
								id="nombre"
								placeholder="Ej: 1ro A Primaria"
								bind:value={formData.nombre}
								required
								maxlength="50"
							/>
						</div>

						<div class="form-group">
							<label for="nivel_educativo">
								Nivel <span class="required">*</span>
							</label>
							<select id="nivel_educativo" bind:value={formData.nivel_educativo} required>
								<option value="" disabled>Seleccione un nivel</option>
								<option value="Inicial">Inicial</option>
								<option value="Primaria">Primaria</option>
								<option value="Secundaria">Secundaria</option>
							</select>
						</div>

						<div class="form-group">
							<label for="gestion">
								Gestión <span class="required">*</span>
							</label>
							<input
								type="text"
								id="gestion"
								placeholder="Ej: 2025"
								bind:value={formData.gestion}
								required
								maxlength="20"
							/>
						</div>

						<div class="form-group">
							<label for="capacidad_maxima">
								Capacidad Máxima <span class="required">*</span>
							</label>
							<input
								type="number"
								id="capacidad_maxima"
								placeholder="Ej: 30"
								bind:value={formData.capacidad_maxima}
								required
								min="1"
								max="100"
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" onclick={onClose} disabled={isSubmitting}>
					Cancelar
				</button>
				<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="spinner-sm"></span>
						Actualizando...
					{:else}
						{@html getIconSvg('save')}
						Actualizar Curso
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.modal-content form {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
		background: white;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.modal-header h2 :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.btn-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #6b7280;
		transition: color 0.2s;
	}

	.btn-close:hover {
		color: #1f2937;
	}

	.btn-close :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.alert {
		padding: 0.875rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border-left: 4px solid #ef4444;
	}

	.form-section {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #27C5DA;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
	}

	.form-group input,
	.form-group select {
		padding: 0.625rem 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #27C5DA;
		box-shadow: 0 0 0 3px rgba(39, 197, 218, 0.1);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
		flex-shrink: 0;
		background: white;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: 8px;
		border: none;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.btn-primary {
		background: #27C5DA;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #22b0c4;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f9fafb;
	}

	.spinner-sm {
		width: 1rem;
		height: 1rem;
		border: 2px solid white;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.modal-content {
			max-width: 100%;
		}
	}
</style>
