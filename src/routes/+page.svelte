<script lang="ts">
    import { onMount } from 'svelte';
    import { apiClient } from '$lib/services/api';

    let currentYear = new Date().getFullYear();
    let isVisible = false;

    // Filters & data
    let courses: any[] = [];
    let selectedCourse: number | null = null;
    let nameQuery = '';
    let typeFilter: string | null = null; // 'reconocimiento' | 'orientacion' | null
    let dateFrom: string | null = null; // YYYY-MM-DD
    let dateTo: string | null = null;
    let yearFilter: number | null = null;
    let monthFilter: number | null = null;

    let esquelas: any[] = [];
    let esquelasTotal = 0;
    let aggregatedByCourse: any[] = [];
    let aggregatedByPeriod: any[] = [];
    let rankingData: any[] = [];
    let students: any[] = [];
    let teachers: any[] = [];

    let loading = false;
    let errorMsg: string | null = null;

    onMount(async () => {
        setTimeout(() => {
            isVisible = true;
        }, 100);

        await loadCourses();
        // load initial aggregates (year)
        await loadAggregateByCourse();
        await loadAggregateByPeriod('year');
    });

    async function loadCourses() {
        try {
            const data = await apiClient.getCourses();
            courses = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('loadCourses error:', err);
            // fallback: mock courses
            courses = [
                { id_curso: 1, nombre_curso: '1° A' },
                { id_curso: 2, nombre_curso: '1° B' },
                { id_curso: 5, nombre_curso: '3° A' }
            ];
        }
    }

    async function searchEsquelas(page = 1, page_size = 20) {
        loading = true;
        errorMsg = null;
        try {
            const params: any = { page, page_size };
            if (nameQuery) params.name = nameQuery;
            if (selectedCourse) params.course = selectedCourse;
            if (typeFilter) params.type = typeFilter;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            if (yearFilter) params.year = yearFilter;
            if (monthFilter) params.month = monthFilter;

            const res = await apiClient.getEsquelas(params);
            console.log('getEsquelas response:', res);

            // if backend returns paginated structure
            if (res && res.data) {
                esquelas = res.data || [];
                esquelasTotal = res.total || esquelas.length;
            } else if (Array.isArray(res)) {
                esquelas = res;
                esquelasTotal = res.length;
            } else {
                esquelas = [];
                esquelasTotal = 0;
            }
        } catch (err: any) {
            console.error('searchEsquelas error:', err);
            // fallback: mock a small set
            esquelas = [
                {
                    id_esquela: 1,
                    fecha: '2024-03-15',
                    observaciones: 'Buen comportamiento',
                    estudiante: { id_estudiante: 123, nombres: 'Juan', apellido_paterno: 'Pérez' },
                    curso: { id_curso: 5, nombre_curso: '3° A' },
                    codigos: [{ id_codigo: 1, tipo: 'reconocimiento', codigo: 'R01' }]
                }
            ];
            esquelasTotal = esquelas.length;
            errorMsg = 'No se pudo conectar al backend. Mostrando datos de ejemplo.';
        } finally {
            loading = false;
        }
    }

    async function loadAggregateByCourse() {
        try {
            const res = await apiClient.getEsquelasAggregateByCourse(yearFilter ?? undefined);
            console.log('aggregate by-course response:', res);
            aggregatedByCourse = Array.isArray(res) ? res : [];
        } catch (err) {
            console.error('loadAggregateByCourse error:', err);
            aggregatedByCourse = [{ curso_id: 5, curso: '3° A', reconocimiento: 5, orientacion: 2 }];
        }
    }

    async function loadAggregateByPeriod(group_by: 'year' | 'month' = 'year') {
        try {
            const res = await apiClient.getEsquelasAggregateByPeriod(group_by);
            console.log('aggregate by-period response:', res);
            aggregatedByPeriod = Array.isArray(res) ? res : [];
        } catch (err) {
            console.error('loadAggregateByPeriod error:', err);
            aggregatedByPeriod = group_by === 'year' ? [{ year: 2024, total: 200 }] : [{ year: 2024, month: 3, total: 22 }];
        }
    }

    async function loadRanking(metric: 'student' | 'course' = 'student', type?: string, limit = 10) {
        try {
            const params: any = { metric, limit };
            if (type) params.type = type;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const res = await apiClient.getReportsRanking(params);
            console.log('ranking response:', res);
            rankingData = res && res.data ? res.data : (Array.isArray(res) ? res : []);
        } catch (err) {
            console.error('loadRanking error:', err);
            rankingData = [
                { id: 123, nombre: 'Juan Pérez García', total: 15, reconocimiento: 10, orientacion: 5, posicion: 1 }
            ];
        }
    }

    async function getStudentEsquelas(studentId: number) {
        try {
            const params: any = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const res = await apiClient.getStudentEsquelas(studentId, params);
            console.log('student esquelas response:', res);
            return res;
        } catch (err) {
            console.error('getStudentEsquelas error:', err);
            return { total: 0, esquelas: [], codigos_resumen: { reconocimiento: 0, orientacion: 0 } };
        }
    }

    function joinCodes(codigos: any[]) {
        return (codigos ?? []).map((c: any) => c.codigo ?? c.tipo).join(', ');
    }

    const features = [
        {
            icon: '📊',
            title: 'Dashboard Completo',
            description: 'Visualiza estadísticas en tiempo real de estudiantes, profesores y rendimiento académico'
        },
        {
            icon: '👥',
            title: 'Gestión de Usuarios',
            description: 'Administra estudiantes, profesores y personal con roles y permisos específicos'
        },
        {
            icon: '📝',
            title: 'Esquelas y Reconocimientos',
            description: 'Registra y gestiona reconocimientos académicos, deportivos y de comportamiento'
        },
        {
            icon: '⚠️',
            title: 'Control de Incidentes',
            description: 'Monitorea y registra incidentes estudiantiles para un mejor seguimiento'
        },
        {
            icon: '📚',
            title: 'Gestión Académica',
            description: 'Control de asistencia, calificaciones y rendimiento por nivel educativo'
        },
        {
            icon: '📈',
            title: 'Reportes Detallados',
            description: 'Genera reportes completos sobre el desempeño institucional y estudiantil'
        }
    ];
</script>

<div class="landing" class:visible={isVisible}>
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <div class="logo-section">
                    <div class="logo">
                        <span class="logo-icon">🎓</span>
                    </div>
                    <h1 class="brand-name">BRISA</h1>
                    <p class="brand-tagline">Sistema de Gestión Escolar</p>
                </div>
                
                <h2 class="hero-title">
                    Bienvenido al Sistema de
                    <span class="highlight">Gestión Escolar BRISA</span>
                </h2>
                
                <p class="hero-description">
                    Plataforma integral diseñada para facilitar la administración educativa, 
                    permitiendo un control eficiente de estudiantes, profesores, incidentes y 
                    reconocimientos académicos.
                </p>
                
                <div class="cta-buttons">
                    <a href="/dashboard" class="btn btn-primary">
                        <span>Ir al Dashboard</span>
                        <span class="arrow">→</span>
                    </a>
                    <a href="/esquelas" class="btn btn-secondary">
                        <span>Ver Esquelas</span>
                    </a>
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-number">1,247</div>
                        <div class="stat-label">Estudiantes Activos</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-number">87</div>
                        <div class="stat-label">Profesores</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-number">23</div>
                        <div class="stat-label">Reconocimientos</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Decorative Elements -->
        <div class="decoration decoration-1"></div>
        <div class="decoration decoration-2"></div>
        <div class="decoration decoration-3"></div>
    </section>
    
    <!-- Filters & Reports Section -->
    <section class="filters">
        <div class="container">
            <h2 class="section-title">Panel de Filtros y Reportes</h2>
            <p class="section-subtitle">Usa los controles para buscar esquelas, ver agregados por curso y generar rankings.</p>

            <div class="filters-grid">
                <div class="filter-card">
                    <label for="course-select">Curso</label>
                    <select id="course-select" bind:value={selectedCourse}>
                        <option value="">-- Todos los cursos --</option>
                        {#each courses as c}
                            <option value={c.id_curso ?? c.id}>{c.nombre_curso ?? c.nombre}</option>
                        {/each}
                    </select>

                    <label for="name-input">Nombre (estudiante/profesor)</label>
                    <input id="name-input" type="text" placeholder="Buscar por nombre" bind:value={nameQuery} />

                    <label for="type-select">Tipo</label>
                    <select id="type-select" bind:value={typeFilter}>
                        <option value="">-- Ambos --</option>
                        <option value="reconocimiento">Reconocimiento</option>
                        <option value="orientacion">Orientación</option>
                    </select>

                    <label for="date-from">Rango de fechas</label>
                    <div class="date-row">
                        <input id="date-from" type="date" bind:value={dateFrom} />
                        <input id="date-to" type="date" bind:value={dateTo} />
                    </div>

                    <div class="actions">
                        <button class="btn btn-primary" on:click={() => searchEsquelas()}>Buscar Esquelas</button>
                        <button class="btn btn-secondary" on:click={() => { loadAggregateByCourse(); loadAggregateByPeriod('year'); }}>Actualizar Agregados</button>
                    </div>

                    {#if errorMsg}
                        <div class="error">{errorMsg}</div>
                    {/if}
                </div>

                <div class="report-card">
                    <div class="report-header">
                        <h3>Resultados ({esquelasTotal})</h3>
                        {#if loading}
                            <div class="loader">Cargando...</div>
                        {/if}
                    </div>

                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Estudiante</th>
                                <th>Curso</th>
                                <th>Códigos</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each esquelas as e}
                                <tr>
                                    <td>{e.fecha}</td>
                                    <td>{e.estudiante?.nombres} {e.estudiante?.apellido_paterno}</td>
                                    <td>{e.curso?.nombre_curso ?? e.curso?.nombre}</td>
                                    <td>{joinCodes(e.codigos)}</td>
                                    <td>{e.observaciones}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="aggregates-grid">
                <div class="aggregate-card">
                    <h4>Agregación por Curso</h4>
                    <ul>
                        {#each aggregatedByCourse as a}
                            <li>{(a.curso ?? a.nombre_curso) || a.curso_id}: {(a.reconocimiento ?? a.reconocimiento_count ?? 0)}R, {(a.orientacion ?? a.orientacion_count ?? 0)}O</li>
                        {/each}
                    </ul>
                </div>

                <div class="aggregate-card">
                    <h4>Agregación por Período</h4>
                    <ul>
                        {#each aggregatedByPeriod as p}
                            <li>{p.year}{p.month ? `-${p.month}` : ''}: {p.total}</li>
                        {/each}
                    </ul>
                </div>

                <div class="aggregate-card">
                    <h4>Ranking (Top)</h4>
                    <button class="btn" on:click={() => loadRanking('student')}>Cargar Ranking Estudiantes</button>
                    <ol>
                        {#each rankingData as r}
                            <li>{r.nombre ?? r.curso}: {r.total} (R:{r.reconocimiento ?? 0} / O:{r.orientacion ?? 0})</li>
                        {/each}
                    </ol>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features">
        <div class="container">
            <h2 class="section-title">Funcionalidades Principales</h2>
            <p class="section-subtitle">
                Todo lo que necesitas para gestionar tu institución educativa en un solo lugar
            </p>
            
            <div class="features-grid">
                {#each features as feature}
                    <div class="feature-card">
                        <div class="feature-icon">{feature.icon}</div>
                        <h3 class="feature-title">{feature.title}</h3>
                        <p class="feature-description">{feature.description}</p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <span class="logo-icon">🎓</span>
                        <span class="logo-text">BRISA</span>
                    </div>
                    <p class="footer-description">
                        Sistema de Gestión Escolar diseñado para optimizar 
                        la administración educativa.
                    </p>
                </div>
                
                <div class="footer-links">
                    <div class="footer-column">
                        <h4>Navegación</h4>
                        <a href="/dashboard">Dashboard</a>
                        <a href="/estudiantes">Estudiantes</a>
                        <a href="/profesores">Profesores</a>
                        <a href="/esquelas">Esquelas</a>
                    </div>
                    
                    <div class="footer-column">
                        <h4>Recursos</h4>
                        <a href="/reportes">Reportes</a>
                        <a href="/incidentes">Incidentes</a>
                        <a href="/administracion">Administración</a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; {currentYear} BRISA - Sistema de Gestión Escolar. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .landing {
        min-height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        opacity: 0;
        transition: opacity 0.6s ease-in-out;
    }

    .landing.visible {
        opacity: 1;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    /* Hero Section */
    .hero {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        overflow: hidden;
        padding: 2rem 0;
    }

    .hero-content {
        position: relative;
        z-index: 2;
        text-align: center;
        animation: fadeInUp 0.8s ease-out;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .logo-section {
        margin-bottom: 3rem;
    }

    .logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
        border-radius: 20px;
        margin-bottom: 1rem;
        box-shadow: 0 10px 30px rgba(34, 211, 238, 0.3);
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    .logo-icon {
        font-size: 2.5rem;
    }

    .brand-name {
        font-size: 3rem;
        font-weight: 700;
        color: #22d3ee;
        margin: 0;
        letter-spacing: 2px;
    }

    .brand-tagline {
        color: #94a3b8;
        font-size: 1.1rem;
        margin: 0.5rem 0 0 0;
    }

    .hero-title {
        font-size: 3rem;
        font-weight: 700;
        color: white;
        margin: 0 0 1.5rem 0;
        line-height: 1.2;
    }

    .highlight {
        background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .hero-description {
        font-size: 1.2rem;
        color: #cbd5e1;
        line-height: 1.8;
        max-width: 700px;
        margin: 0 auto 3rem auto;
    }

    .cta-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 4rem;
        flex-wrap: wrap;
    }

    .btn {
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .btn-primary {
        background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
        color: white;
        box-shadow: 0 10px 30px rgba(34, 211, 238, 0.3);
    }

    .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 40px rgba(34, 211, 238, 0.4);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-3px);
    }

    .arrow {
        transition: transform 0.3s ease;
    }

    .btn-primary:hover .arrow {
        transform: translateX(5px);
    }

    .stats {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        flex-wrap: wrap;
    }

    .stat-item {
        text-align: center;
    }

    .stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: #22d3ee;
        margin-bottom: 0.5rem;
    }

    .stat-label {
        color: #cbd5e1;
        font-size: 0.9rem;
    }

    .stat-divider {
        width: 2px;
        height: 50px;
        background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent);
    }

    /* Decorative Elements */
    .decoration {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.3;
        pointer-events: none;
    }

    .decoration-1 {
        width: 400px;
        height: 400px;
        background: #22d3ee;
        top: -100px;
        left: -100px;
        animation: pulse 8s ease-in-out infinite;
    }

    .decoration-2 {
        width: 300px;
        height: 300px;
        background: #06b6d4;
        bottom: 100px;
        right: -50px;
        animation: pulse 6s ease-in-out infinite;
    }

    .decoration-3 {
        width: 250px;
        height: 250px;
        background: #0891b2;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 10s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
            opacity: 0.3;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.2;
        }
    }

    /* Features Section */
    .features {
        padding: 6rem 0;
        background: rgba(255, 255, 255, 0.02);
    }

    /* Filters & Reports */
    .filters {
        padding: 3rem 0;
    }

    .filters-grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 1.5rem;
        align-items: start;
        margin-bottom: 2rem;
    }

    .filter-card, .report-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        padding: 1.25rem;
        border-radius: 12px;
    }

    .filter-card label {
        display: block;
        margin-top: 0.75rem;
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .filter-card input[type="text"], .filter-card select, .filter-card input[type="date"] {
        width: 100%;
        padding: 0.5rem 0.75rem;
        margin-top: 0.4rem;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(0,0,0,0.25);
        color: #e2e8f0;
    }

    .date-row {
        display: flex;
        gap: 0.5rem;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .results-table {
        width: 100%;
        border-collapse: collapse;
        background: transparent;
    }

    .results-table th, .results-table td {
        text-align: left;
        padding: 0.6rem 0.75rem;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        color: #cbd5e1;
        font-size: 0.95rem;
    }

    .aggregates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .aggregate-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        padding: 1rem;
        border-radius: 10px;
    }

    .loader {
        color: #94a3b8;
        font-size: 0.9rem;
    }

    .error {
        margin-top: 0.75rem;
        background: rgba(220, 38, 38, 0.08);
        color: #fecaca;
        padding: 0.6rem;
        border-radius: 8px;
        font-size: 0.9rem;
    }

    .section-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        text-align: center;
        margin: 0 0 1rem 0;
    }

    .section-subtitle {
        font-size: 1.1rem;
        color: #94a3b8;
        text-align: center;
        margin: 0 0 4rem 0;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .feature-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 2rem;
        transition: all 0.3s ease;
    }

    .feature-card:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(34, 211, 238, 0.3);
        box-shadow: 0 10px 30px rgba(34, 211, 238, 0.1);
    }

    .feature-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .feature-title {
        font-size: 1.3rem;
        font-weight: 600;
        color: white;
        margin: 0 0 1rem 0;
    }

    .feature-description {
        color: #cbd5e1;
        line-height: 1.6;
        margin: 0;
    }

    /* Footer */
    .footer {
        background: rgba(0, 0, 0, 0.3);
        padding: 3rem 0 1rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        margin-bottom: 2rem;
    }

    .footer-brand {
        max-width: 400px;
    }

    .footer-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .logo-text {
        font-size: 1.5rem;
        font-weight: 700;
        color: #22d3ee;
        letter-spacing: 1px;
    }

    .footer-description {
        color: #94a3b8;
        line-height: 1.6;
        margin: 0;
    }

    .footer-links {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
    }

    .footer-column h4 {
        color: white;
        font-size: 1.1rem;
        margin: 0 0 1rem 0;
    }

    .footer-column a {
        display: block;
        color: #94a3b8;
        text-decoration: none;
        margin-bottom: 0.75rem;
        transition: color 0.3s ease;
    }

    .footer-column a:hover {
        color: #22d3ee;
    }

    .footer-bottom {
        text-align: center;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-bottom p {
        color: #64748b;
        margin: 0;
        font-size: 0.9rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .hero-title {
            font-size: 2rem;
        }

        .brand-name {
            font-size: 2rem;
        }

        .hero-description {
            font-size: 1rem;
        }

        .stats {
            gap: 1rem;
        }

        .stat-divider {
            display: none;
        }

        .footer-content {
            grid-template-columns: 1fr;
        }

        .cta-buttons {
            flex-direction: column;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>