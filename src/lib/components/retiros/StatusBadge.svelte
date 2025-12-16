<script lang="ts">
  import type { EstadoSolicitud } from '$lib/types/retiros';

  export let estado: EstadoSolicitud;

  const styles: Record<EstadoSolicitud, string> = {
    recibida: 'bg-blue-100 text-blue-800 border-blue-200',
    derivada: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    aprobada: 'bg-green-100 text-green-800 border-green-200',
    rechazada: 'bg-red-100 text-red-800 border-red-200',
    cancelada: 'bg-gray-100 text-gray-800 border-gray-200',
    finalizado: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  const labels: Record<EstadoSolicitud, string> = {
    recibida: 'Recibida',
    derivada: 'Derivada',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
    finalizado: 'Finalizado'
  };
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {styles[estado] || 'bg-gray-100 text-gray-800'}">
  {labels[estado] || estado}
</span>
