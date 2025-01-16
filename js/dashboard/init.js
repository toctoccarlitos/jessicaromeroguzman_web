import { ComponentLoader } from '../components/ComponentLoader.js';
import { authService } from '../services/authService.js';
import { DashboardRouter } from './router.js';
import { NewsletterView } from '../views/newsletter.js';
import { HomeView } from '../views/home.js';

export async function initializeDashboard() {
    try {
        console.log('Starting dashboard initialization...');

        // 1. Validar autenticación
        const canAccess = await validateDashboardAccess();
        if (!canAccess) {
            console.log('Access denied, redirecting to login...');
            window.location.href = '/login.html';
            return;
        }

        console.log('Access validated successfully');

        // 2. Inicializar componentes una vez validado el acceso
        console.log('Initializing components...');
        const componentLoader = new ComponentLoader();
        await componentLoader.init();

        // 3. Inicializar UI base
        console.log('Initializing UI...');
        await initializeUI();

        // 4. Cargar datos del usuario
        console.log('Loading user profile...');
        await loadUserProfile();

        // 5. Inicializar router
        console.log('Setting up router...');
        const router = new DashboardRouter();

        // Registrar rutas disponibles
        router.addRoute('/dashboard', HomeView);
        router.addRoute('/newsletter', NewsletterView);

        // Determinar ruta inicial
        let initialRoute = '/dashboard';
        const currentPath = window.location.pathname;
        if (currentPath.includes('newsletter')) {
            initialRoute = '/newsletter';
        }

        // Navegar a la ruta inicial
        console.log('Navigating to initial route:', initialRoute);
        await router.navigate(initialRoute);

        console.log('Dashboard initialization complete');

        return {
            componentLoader,
            authService,
            router
        };
    } catch (error) {
        console.error('Error initializing dashboard:', error);

        // Manejo de errores más descriptivo
        const errorMessage = error.response?.message || error.message || 'Error desconocido';
        alert(`Error inicializando dashboard: ${errorMessage}`);

        // Solo redirigir al login si es un error de autenticación
        if (error.status === 401) {
            window.location.href = '/login.html';
        }

        throw error;
    }
}

async function validateDashboardAccess() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found');
            return false;
        }

        try {
            await authService.getProfile();
            return true;
        } catch (error) {
            if (error.status === 401) {
                console.log('Token expired, attempting refresh...');
                try {
                    await authService.refreshToken();
                    return true;
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    return false;
                }
            }
            return false;
        }
    } catch (error) {
        console.error('Access validation error:', error);
        return false;
    }
}

function initializeUI() {
    try {
        console.log('Initializing UI components...');

        // Verificar que todos los elementos necesarios existen
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const userMenuButton = document.getElementById('user-menu-button');

        if (!sidebar || !mainContent) {
            throw new Error('Elementos básicos del dashboard no encontrados');
        }

        // Inicializar componentes solo si existen
        if (sidebar) {
            initializeSidebar();
            console.log('Sidebar initialized');
        }

        if (userMenuButton) {
            initializeUserMenu();
            console.log('User menu initialized');
        }

        initializeMobileMenu();
        console.log('Mobile menu initialized');

        console.log('UI initialization complete');
    } catch (error) {
        console.error('UI initialization error:', error);
        throw new Error('No se pudo inicializar la interfaz - elementos faltantes');
    }
}

function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapse-menu-btn');
    const dashboardContent = document.querySelector('.dashboard-content');

    // Solo proceder si todos los elementos existen
    if (!(collapseBtn && sidebar && dashboardContent)) {
        console.log('Skipping sidebar initialization - missing elements');
        return;
    }

    collapseBtn.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        dashboardContent.style.marginLeft = isCollapsed ? '70px' : '260px';

        // Actualizar header si existe
        const header = document.querySelector('.dashboard-header');
        if (header) {
            header.style.width = `calc(100% - ${isCollapsed ? '70px' : '260px'})`;
        }

        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });

    // Restaurar estado anterior
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        dashboardContent.style.marginLeft = '70px';

        const header = document.querySelector('.dashboard-header');
        if (header) {
            header.style.width = 'calc(100% - 70px)';
        }
    }
}

function initializeUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');

    if (!(userMenuButton && userDropdown)) {
        console.log('Skipping user menu initialization - missing elements');
        return;
    }

    userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('visible');
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target)) {
            userDropdown.classList.remove('visible');
        }
    });
}

function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');

    if (!(mobileMenuButton && mobileOverlay && sidebar)) {
        console.log('Skipping mobile menu initialization - missing elements');
        return;
    }

    mobileMenuButton.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        mobileOverlay.classList.add('visible');
        document.body.classList.add('mobile-menu-open');
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        mobileOverlay.classList.remove('visible');
        document.body.classList.remove('mobile-menu-open');
    });
}

async function loadUserProfile() {
    try {
        const userProfile = await authService.getProfile();
        if (!userProfile) {
            throw new Error('No se pudo cargar el perfil de usuario');
        }

        // Actualizar elementos de UI
        updateUIWithProfile(userProfile);
        setupLogoutButton();

    } catch (error) {
        console.error('Error loading user profile:', error);
        throw new Error('Error cargando el perfil de usuario');
    }
}

// función para actualizar UI con el perfil
function updateUIWithProfile(profile) {
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = profile.email || 'Usuario';
    });

    document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = profile.email;
    });

    document.querySelectorAll('.user-role').forEach(el => {
        el.textContent = profile.roles?.includes('ROLE_ADMIN') ?
            'Administrador' : 'Usuario';
    });
}

// función para configurar el botón de logout
function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await authService.logout();
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error al cerrar sesión. Por favor, intenta de nuevo.');
            }
        });
    }
}