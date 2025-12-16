<script lang="ts">
	import { getIconSvg } from '$lib/components/svg.js';
	import { coursesService, type CursoCreateDTO } from '$lib/services/courses';

	interface Props {
		onClose: () => void;
		onSuccess: () => void;
	}

	let { onClose, onSuccess }: Props = $props();

	let formData: CursoCreateDTO = {
		nombre: '',
		gestion: new Date().getFullYear().toString(),
		nivel_educativo: 'Inicial',
		capacidad_maxima: 30
	};

	let isSubmitting = false;
	let errorMessage = '';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';

		try {
			await coursesService.createCurso(formData);
			onSuccess();
		} catch (error: any) {
			errorMessage = error.message || 'Error al crear el curso';
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
			<h2>{@html getIconSvg('book-open')} Nuevo Curso</h2>
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
						/>
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
						/>
					</div>

					<div class="form-group full-width">
						<label for="nivel_educativo">
							Nivel Educativo <span class="required">*</span>
						</label>
						<select id="nivel_educativo" bind:value={formData.nivel_educativo} required>
							<option value="" disabled>Seleccione un nivel</option>
							<option value="Inicial">Inicial</option>
							<option value="Primaria">Primaria</option>
							<option value="Secundaria">Secundaria</option>
						</select>
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
						Guardando...
					{:else}
						{@html getIconSvg('save')}
						Guardar Curso
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
	}

	.form-group input,
	.form-group select {
		padding: 0.625rem 0.875rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
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
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-secondary {
		background: white;
		color: #4b5563;
		border: 1px solid #e5e7eb;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f9fafb;
	}

	.spinner-sm {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
