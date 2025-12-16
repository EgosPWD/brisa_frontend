<!--src/routes.+layout.svelte-->

<script lang="ts">
	import "../app.css";
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { authStore } from "$lib/stores/Usuarios_Roles/auth.svelte";
	import { getIconSvg } from "$lib/components/svg.js";
	import type { ModuloSistema } from "$lib/types/Usuarios_Roles/auth";
	import LogoutDialog from "./LogoutDialog.svelte";

	import {
		obtenerNotificacionesUsuario,
		marcarNotificacionComoLeida,
		marcarTodasComoLeidas,
	} from "$lib/services/incidentes/notificaciones";
	import type { NotificacionRead } from "$lib/types/incidentes/notificaciones";

	let { children } = $props();
	let sidebarCollapsed = $state(false);
	let reportesManuallyToggled = $state(false);
	let reportesSectionsExpanded = $state<Record<string, boolean>>({});
	let showLogoutDialog = $state(false);
	const isAuthenticated = $derived(authStore.isAuthenticated);
	const currentUser = $derived(authStore.user);
	const canManageCodigos = $derived(authStore.esAdministrador);

	// Usar la store $page para obtener la ruta actual reactivamente
	const currentPath = $derived($page.url.pathname);

	// Auto-expandir reportes basado en la ruta actual o si fue abierto manualmente
	const reportesExpanded = $derived(
		currentPath.startsWith("/reportes") || reportesManuallyToggled,
	);

	const menuItems = [
		{
			label: "Dashboard",
			icon: "dashboard",
			href: "/",
			modulo: null as ModuloSistema | null,
		},
		{
			label: "Usuarios y Roles",
			icon: "users",
			href: "/Usuarios_Roles",
			modulo: "usuarios" as ModuloSistema,
		},
		{
			label: "Estudiantes",
			icon: "users",
			href: "/estudiantes",
			modulo: "estudiantes" as ModuloSistema,
		},
		{
			label: "Profesores",
			icon: "user",
			href: "/profesores",
			modulo: "profesores" as ModuloSistema,
		},
		{
			label: "Cursos",
			icon: "book-open",
			href: "/cursos",
			modulo: "cursos" as ModuloSistema,
		},
		{
			label: "Materias",
			icon: "book",
			href: "/profesores/materias",
			modulo: "profesores" as ModuloSistema,
		},
		{
			label: "Retiros Tempranos",
			icon: "clock",
			href: "/retiros",
			modulo: "retiros_tempranos" as ModuloSistema,
		},
		{
			label: "Incidentes",
			icon: "alert-triangle",
			href: "/incidentes",
			modulo: "incidentes" as ModuloSistema,
		},
		{
			label: "Esquelas",
			icon: "clipboard-list",
			href: "/esquelas",
			modulo: "esquelas" as ModuloSistema,
		},
		{
			label: "Administración",
			icon: "settings",
			href: "/administracion",
			modulo: "administracion" as ModuloSistema,
		},
	];

	const reportesSubmenu = [
	
		{
			label: "Estudiantes",
			icon: "graduation-cap",
			prefix: "/reportes/estudiantes",
			items: [
				{ label: "Listado General", href: "/reportes" },
				{
					label: "Apoderados",
					href: "/reportes/estudiantes/apoderados",
				},
				{ label: "Contactos", href: "/reportes/estudiantes/contactos" },
				{
					label: "Distribución Etaria",
					href: "/reportes/estudiantes/edades",
				},
				{
					label: "Historial de Cursos",
					href: "/reportes/estudiantes/historial",
				},
			],
		},
		{
			label: "Académico",
			icon: "book-open",
			prefix: "/reportes/academico",
			items: [
				{
					label: "Profesores Asignados",
					href: "/reportes/academico/profesores",
				},
				{
					label: "Materias por Nivel",
					href: "/reportes/academico/materias",
				},
				{
					label: "Carga Académica",
					href: "/reportes/academico/carga-academica",
				},
				{
					label: "Cursos por Gestión",
					href: "/reportes/academico/cursos-gestion",
				},
			],
		},
		{
			label: "Esquelas",
			icon: "clipboard-list",
			prefix: "/reportes/esquelas",
			items: [
				{ label: "Por Emisor", href: "/reportes/esquelas/por-emisor" },
				{
					label: "Por Rango de Fechas",
					href: "/reportes/esquelas/por-fecha",
				},
				{
					label: "Códigos Frecuentes",
					href: "/reportes/esquelas/codigos-frecuentes",
				},
			],
		},
	];

	let notifications: NotificacionRead[] = $state([]);
	let unreadCount = $state(0);
	let showModal = $state(false);
	let loadingNotifications = $state(false);

	// Función para verificar si el usuario puede acceder a un módulo
	function canAccessModule(modulo: ModuloSistema | null): boolean {
		if (!modulo) return true; // Dashboard y módulos sin permiso siempre accesibles
		return authStore.puedeAccederModulo(modulo);
	}

	function goToProfile() {
		goto("/Usuarios_Roles/users/");
	}

	onMount(async () => {
		// Inicializar authStore
		await authStore.init();

		// Si no está en login y no está autenticado, redirigir
		if (currentPath !== "/login" && !authStore.isAuthenticated) {
			goto("/login");
		}

		if (currentUser?.usuario_id) {
			fetchUnreadCount();
		}
	});

	let pollingInterval: number | undefined;
	onMount(() => {
		if (currentUser?.usuario_id) {
			pollingInterval = setInterval(fetchUnreadCount, 60000);
		}
	});

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
	});

	async function fetchUnreadCount() {
		if (!currentUser?.usuario_id) return;
		try {
			const unread = await obtenerNotificacionesUsuario(
				currentUser.usuario_id,
				true,
			);
			unreadCount = unread.length;
		} catch (e) {
			console.error("Error fetching unread count:", e);
		}
	}

	async function fetchNotifications() {
		if (!currentUser?.usuario_id) return;
		loadingNotifications = true;
		try {
			notifications = await obtenerNotificacionesUsuario(
				currentUser.usuario_id,
				false,
				50,
			); // Limitar a 50 recientes para no sobrecargar
		} catch (e) {
			console.error("Error fetching notifications:", e);
		} finally {
			loadingNotifications = false;
		}
	}

	async function markAllAsRead() {
		if (!currentUser?.usuario_id) return; // ✅ Validación temprana

		try {
			await marcarTodasComoLeidas(currentUser.usuario_id); // ✅ Sin optional chaining
			notifications.forEach((n) => (n.leido = true));
			unreadCount = 0;
		} catch (e) {
			console.error("Error marking all as read:", e);
		}
	}

	function openNotifications() {
		showModal = true;
		fetchNotifications();
	}

	function closeNotifications() {
		showModal = false;
	}

	function handleLogout() {
		showLogoutDialog = true;
	}

	function confirmLogout() {
		authStore.logout();
		goto("/login");
		showLogoutDialog = false;
	}

	function cancelLogout() {
		showLogoutDialog = false;
	}

	function userIsAdmin(user: any): boolean {
		return Boolean(
			user?.roles?.some(
				(role: any) =>
					role?.nombre === "Administrativo" ||
					role?.nombre === "Administrador" ||
					role?.nombre === "Director",
			),
		);
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function toggleReportes() {
		if (!currentPath.startsWith("/reportes")) {
			reportesManuallyToggled = !reportesManuallyToggled;
		}
		if (sidebarCollapsed) {
			sidebarCollapsed = false;
		}
	}

	function isReportesSectionExpanded(prefix: string) {
		const override = reportesSectionsExpanded[prefix];
		return override ?? currentPath.startsWith(prefix);
	}

	function toggleReportesSection(prefix: string) {
		reportesSectionsExpanded = {
			...reportesSectionsExpanded,
			[prefix]: !isReportesSectionExpanded(prefix),
		};
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if currentPath === "/login"}
	{@render children?.()}
{:else if isAuthenticated}
	<div class="app-layout">
		<aside class="sidebar" class:collapsed={sidebarCollapsed}>
			<div class="sidebar-header">
				<button
					class="toggle-sidebar-btn"
					onclick={toggleSidebar}
					aria-label="Toggle sidebar"
				>
					{@html getIconSvg("menu")}
				</button>
				{#if !sidebarCollapsed}
					<div class="logo">
						<span class="logo-icon"
							>{@html getIconSvg("graduation-cap")}</span
						>
						<div class="logo-text">
							<h1>BRISA</h1>
							<span>Sistema Escolar</span>
						</div>
					</div>
				{/if}
			</div>

			<nav class="sidebar-nav">
				{#each menuItems as item}
					{#if canAccessModule(item.modulo)}
						<a
							href={item.href}
							class="nav-item"
							class:active={currentPath === item.href}
							title={item.label}
						>
							<span class="nav-icon"
								>{@html getIconSvg(item.icon)}</span
							>
							{#if !sidebarCollapsed}
								<span class="nav-label">{item.label}</span>
							{/if}
						</a>
					{/if}
				{/each}

				{#if canManageCodigos}
					<a
						href="/codigos"
						class="nav-item"
						class:active={currentPath === "/codigos"}
						title="Códigos Esquelas"
					>
						<span class="nav-icon">{@html getIconSvg("code")}</span>
						{#if !sidebarCollapsed}
							<span class="nav-label">Códigos Esquelas</span>
						{/if}
					</a>

					<!-- Menú expandible de Reportes -->
					<div class="nav-item-group">
						<button
							class="nav-item nav-item-expandable"
							class:active={currentPath.startsWith("/reportes")}
							onclick={toggleReportes}
							title="Reportes"
						>
							<span class="nav-icon"
								>{@html getIconSvg("bar-chart")}</span
							>
							{#if !sidebarCollapsed}
								<span class="nav-label">Reportes</span>
								<span
									class="expand-icon"
									class:expanded={reportesExpanded}
								>
									{@html getIconSvg(
										reportesExpanded
											? "chevron-down"
											: "chevron-right",
									)}
								</span>
							{/if}
						</button>

						{#if reportesExpanded && !sidebarCollapsed}
							<div class="submenu">
								{#each reportesSubmenu as section}
									<div class="submenu-section">
										<button
											type="button"
											class="submenu-section-header submenu-section-toggle"
											onclick={() => toggleReportesSection(section.prefix)}
										>
											<span class="submenu-icon"
												>{@html getIconSvg(
													section.icon,
												)}</span
											>
											<span class="submenu-label"
												>{section.label}</span
											>
												<span
													class="submenu-expand-icon"
													class:expanded={isReportesSectionExpanded(section.prefix)}
												>
													{@html getIconSvg(
														isReportesSectionExpanded(section.prefix)
															? "chevron-down"
															: "chevron-right",
													)}
												</span>
										</button>
										{#if isReportesSectionExpanded(section.prefix)}
											<div class="submenu-items">
												{#each section.items as subItem}
													<a
														href={subItem.href}
														class="submenu-item"
														class:active={currentPath ===
															subItem.href}
													>
														{subItem.label}
													</a>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</nav>

			<div class="sidebar-footer">
				<button
					class="nav-item logout-btn"
					onclick={handleLogout}
					title="Cerrar Sesión"
				>
					<span class="nav-icon">{@html getIconSvg("log-out")}</span>
					{#if !sidebarCollapsed}
						<span class="nav-label">Cerrar Sesión</span>
					{/if}
				</button>
			</div>
		</aside>

		<div class="main-content-wrapper">
			<header class="top-bar">
				<div class="search-bar">
					<input type="text" placeholder="Buscar..." />
					<span class="search-icon">{@html getIconSvg("search")}</span
					>
				</div>
				<div class="top-bar-actions">
					<button
						class="action-btn notification-btn"
						onclick={openNotifications}
					>
						{@html getIconSvg("bell")}
						{#if unreadCount > 0}
							<span class="notification-badge">{unreadCount}</span>
						{/if}
					</button>
					<button class="user-profile" onclick={goToProfile}>
						<div class="avatar">
							{currentUser?.nombres?.[0] || "U"}{currentUser
								?.usuario?.[0] || ""}
						</div>
						<div class="user-info">
							<span class="user-name">
								{currentUser?.nombres || "Usuario"}
							</span>
							<span class="user-role">
								{currentUser?.rol || "Rol"}
							</span>
						</div>
					</button>
				</div>
			</header>
			<main class="content-area">
				{@render children?.()}
			</main>
		</div>
	</div>

	{#if showModal}
		<div
			class="notifications-modal"
			role="button"
			tabindex="0"
			onclick={(e) => {
				if (e.target === e.currentTarget) closeNotifications();
			}}
			onkeydown={(e) => {
				if (e.key === "Escape" || e.key === "Enter" || e.key === " ") closeNotifications();
			}}
		>
			<div class="modal-content">
				<h2>Notificaciones</h2>
				<button onclick={markAllAsRead}>Marcar todas como leídas</button
				>
				{#if loadingNotifications}
					<p class="loading">Cargando...</p>
				{:else if notifications.length === 0}
					<p class="empty">No hay notificaciones.</p>
				{:else}
					{#each notifications as notif}
						<div
							class="notification-item"
							class:unread={!notif.leido}
						>
							<h3>{notif.titulo}</h3>
							<p>{notif.mensaje}</p>
							<small
								>{new Date(notif.fecha).toLocaleString()}</small
							>
						</div>
					{/each}
				{/if}
				<button onclick={closeNotifications}>Cerrar</button>
			</div>
		</div>
	{/if}
{:else}
	<!-- Pantalla de carga mientras se verifica autenticación -->
	<div class="loading-container">
		<div class="spinner"></div>
		<p>Verificando sesión...</p>
	</div>
{/if}

<LogoutDialog
	bind:show={showLogoutDialog}
	on:confirm={confirmLogout}
	on:cancel={cancelLogout}
/>

<style>
	@import "./layout.css";
</style>
