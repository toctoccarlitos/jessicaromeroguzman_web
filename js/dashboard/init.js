import { ComponentLoader } from '../components/ComponentLoader.js';
import { authService } from '../services/authService.js';
import { routeProtection } from '../utils/routeProtection.js';

export async function initializeDashboard() {
    try {
        // 1. Validar autenticación
        const canAccess = await validateDashboardAccess();
        if (!canAccess) {
            // console.log('Access denied, redirecting to login...');
            window.location.href = '/login.html';
            return;
        }

        // 2. Inicializar componentes una vez validado el acceso
        const componentLoader = new ComponentLoader();
        await componentLoader.init();

        // 3. Inicializar la UI del dashboard
        initializeUI();

        // 4. Cargar datos del usuario
        await loadUserProfile();

        return {
            componentLoader,
            authService
        };
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        window.location.href = '/login.html';
    }
}

async function validateDashboardAccess() {
    try {
        // Verificar si tenemos token
        const token = localStorage.getItem('token');
        if (!token) {
            // console.log('No token found');
            return false;
        }

        // Verificar si el token es válido
        try {
            // Intentar obtener el perfil como validación
            await authService.getProfile();
            return true;
        } catch (error) {
            // Si es error de autorización, intentar refresh
            if (error.status === 401) {
                try {
                    await authService.refreshToken();
                    return true;
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                    return false;
                }
            }
            return false;
        }
    } catch (error) {
        console.error('Error validating access:', error);
        return false;
    }
}

function initializeUI() {
    initializeSidebar();
    initializeUserMenu();
    initializeMobileMenu();
}

function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapse-menu-btn');
    const dashboardContent = document.querySelector('.dashboard-content');

    if (collapseBtn && sidebar && dashboardContent) {
        collapseBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            dashboardContent.style.marginLeft = isCollapsed ? '70px' : '260px';

            // Actualizar header
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
}

function initializeUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuButton && userDropdown) {
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
}

async function loadUserProfile() {
    try {
        const userProfile = await authService.getProfile();

        // Actualizar elementos de UI con datos del usuario
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = userProfile.email || 'Usuario';
        });

        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = userProfile.email;
        });

        document.querySelectorAll('.user-role').forEach(el => {
            el.textContent = userProfile.roles?.includes('ROLE_ADMIN') ?
                'Administrador' : 'Usuario';
        });

        // Configurar botón de logout
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    await authService.logout();
                    window.location.href = '/login.html';
                } catch (error) {
                    console.error('Error during logout:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}

function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');

    if (mobileMenuButton && mobileOverlay && sidebar) {
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
}