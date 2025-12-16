<script lang="ts">
	import { getIconSvg } from '$lib/components/svg.js';
	import { coursesService } from '$lib/services/courses';

	interface Props {
		gestionActual: string;
		onClose: () => void;
		onSuccess: (gestionDestino: string) => void;
	}

	let { gestionActual, onClose, onSuccess }: Props = $props();

	let gestionOrigen = $state(gestionActual);
	let gestionDestino = $state(String(Number(gestionActual) + 1));
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let warningMessage = $state('');
	let isChecking = $state(false);

	async function checkGestionDestino() {
		if (!gestionDestino) return;
		
		isChecking = true;
		warningMessage = '';
		
		try {
			const cursosDestino = await coursesService.getCursosPorGestion(gestionDestino);
			if (cursosDestino.length > 0) {
				warningMessage = `⚠️ Ya existen ${cursosDestino.length} curso(s) en la gestión ${gestionDestino}. No se podrá copiar a menos que los elimine primero.`;
			}
		} catch (error) {
			// Si da error, probablemente es que no existen cursos en esa gestión
			warningMessage = '';
		} finally {
			isChecking = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';
		successMessage = '';

		// Validación
		if (gestionOrigen === gestionDestino) {
			errorMessage = 'La gestión origen y destino deben ser diferentes';
			isSubmitting = false;
			return;
		}

		try {
			const response = await coursesService.copiarGestion({
				gestion_origen: gestionOrigen,
				gestion_destino: gestionDestino
			});
			successMessage = `Se copiaron ${response.cursos_copiados} cursos exitosamente`;
			setTimeout(() => {
				onSuccess(gestionDestino);
				onClose();
			}, 1500);
		} catch (error: any) {
			// Extraer el mensaje del backend si está disponible
			if (error.details?.detail) {
				errorMessage = error.details.detail;
			} else if (error.message) {
				errorMessage = error.message;
			} else {
				errorMessage = 'Error al copiar cursos';
			}
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
			<h2>{@html getIconSvg('copy')} Copiar Cursos a Nueva Gestión</h2>
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

				{#if successMessage}
					<div class="alert alert-success">
						{@html getIconSvg('check-circle')}
						{successMessage}
					</div>
				{/if}

				<div class="info-box">
					{@html getIconSvg('info')}
					<p>
						Esta acción copiará todos los cursos de una gestión a otra. Los estudiantes no serán
						copiados automáticamente.
					</p>
				</div>

				<div class="form-section">
					<div class="form-group">
						<label for="gestionOrigen">
							Gestión Origen <span class="required">*</span>
						</label>
						<input
							type="text"
							id="gestionOrigen"
							placeholder="Ej: 2025"
							bind:value={gestionOrigen}
							required
							maxlength="20"
							disabled={isSubmitting}
						/>
						<span class="helper-text">Gestión desde la cual se copiarán los cursos</span>
					</div>

					<div class="arrow-icon">
						{@html getIconSvg('arrow-right')}
					</div>

					<div class="form-group">
						<label for="gestionDestino">
							Gestión Destino <span class="required">*</span>
						</label>
						<input
							type="text"
							id="gestionDestino"
							placeholder="Ej: 2026"
							bind:value={gestionDestino}
							onblur={checkGestionDestino}
							required
							maxlength="20"
							disabled={isSubmitting}
						/>
						<span class="helper-text">Nueva gestión donde se crearán los cursos</span>
						
						{#if isChecking}
							<div class="checking-message">
								{@html getIconSvg('loader')}
								Verificando...
							</div>
						{/if}
						
						{#if warningMessage}
							<div class="warning-message">
								{warningMessage}
							</div>
						{/if}
					</div>
				</div>

				<div class="warning-box">
					{@html getIconSvg('alert-triangle')}
					<div class="warning-content">
						<strong>Importante:</strong>
						<ul>
							<li>Se crearán copias de todos los cursos con la nueva gestión</li>
							<li>Los nombres y niveles se mantendrán iguales</li>
							<li>Los estudiantes NO serán copiados automáticamente</li>
							<li>Podrá asignar estudiantes después de la copia</li>
						</ul>
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
						Copiando...
					{:else}
						{@html getIconSvg('copy')}
						Copiar Cursos
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.alert :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border-left: 4px solid #ef4444;
	}

	.alert-success {
		background: #d1fae5;
		color: #065f46;
		border-left: 4px solid #10b981;
	}

	.info-box {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #dbeafe;
		border-left: 4px solid #3b82f6;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.info-box :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		color: #1e40af;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.info-box p {
		margin: 0;
		font-size: 0.875rem;
		color: #1e3a8a;
		line-height: 1.5;
	}

	.form-section {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		align-items: start;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
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

	.form-group input {
		padding: 0.625rem 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #27C5DA;
		box-shadow: 0 0 0 3px rgba(39, 197, 218, 0.1);
	}

	.form-group input:disabled {
		background: #f9fafb;
		cursor: not-allowed;
	}

	.helper-text {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.375rem;
	}

	.arrow-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #27C5DA;
		margin-top: 1.875rem;
	}

	.arrow-icon :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.warning-box {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #fef3c7;
		border-left: 4px solid #f59e0b;
		border-radius: 8px;
	}

	.warning-box :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		color: #b45309;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.warning-content {
		font-size: 0.875rem;
		color: #78350f;
		line-height: 1.5;
	}

	.warning-content strong {
		display: block;
		margin-bottom: 0.5rem;
	}

	.warning-content ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.warning-content li {
		margin-bottom: 0.25rem;
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

	.checking-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 6px;
		font-size: 0.8125rem;
		color: #0369a1;
	}

	.checking-message :global(svg) {
		width: 1rem;
		height: 1rem;
		animation: spin 1s linear infinite;
	}

	.warning-message {
		margin-top: 0.5rem;
		padding: 0.75rem 1rem;
		background: #fff7ed;
		border: 1px solid #fed7aa;
		border-left: 4px solid #f59e0b;
		border-radius: 6px;
		font-size: 0.8125rem;
		color: #92400e;
		line-height: 1.4;
	}

	@media (max-width: 640px) {
		.form-section {
			grid-template-columns: 1fr;
		}

		.arrow-icon {
			transform: rotate(90deg);
		}
	}
</style>
