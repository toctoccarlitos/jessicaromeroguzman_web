import { httpInterceptor } from '../utils/httpInterceptor.js';
import { loadingManager } from '../utils/loading-manager.js';
import { notificationManager } from '../utils/notification-manager.js';

export class NewsletterView {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            search: '',
            status: '',
            date: ''
        };
        this.subscribers = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Inicializar elementos
            this.searchInput = document.getElementById('search-newsletter');
            this.statusFilter = document.getElementById('status-filter');
            this.dateFilter = document.getElementById('date-filter');
            this.tableBody = document.getElementById('newsletter-table-body');
            this.emptyState = document.getElementById('empty-state');
            this.loadingOverlay = document.getElementById('table-loading');
            this.prevButton = document.getElementById('prev-page');
            this.nextButton = document.getElementById('next-page');
            this.paginationInfo = document.getElementById('pagination-info');

            // Configurar event listeners
            this.setupEventListeners();

            // Cargar datos iniciales
            await this.loadData();

            this.initialized = true;
        } catch (error) {
            console.error('Error initializing newsletter view:', error);
            this.showError('Error al cargar los suscriptores');
        }
    }

    setupEventListeners() {
        // Búsqueda con debounce
        let searchTimeout;
        this.searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadData();
            }, 300);
        });

        // Filtros de estado y fecha
        this.statusFilter?.addEventListener('change', () => {
            this.filters.status = this.statusFilter.value;
            this.currentPage = 1;
            this.loadData();
        });

        this.dateFilter?.addEventListener('change', () => {
            this.filters.date = this.dateFilter.value;
            this.currentPage = 1;
            this.loadData();
        });

        // Paginación
        this.prevButton?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadData();
            }
        });

        this.nextButton?.addEventListener('click', () => {
            this.currentPage++;
            this.loadData();
        });
    }

    async loadData() {
        try {
            // Construir query string para los filtros
            const queryParams = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: this.pageSize.toString()
            });

            if (this.filters.search) {
                queryParams.append('search', this.filters.search);
            }
            if (this.filters.status) {
                queryParams.append('status', this.filters.status);
            }
            if (this.filters.date) {
                queryParams.append('date', this.filters.date);
            }

            // Hacer la petición usando el httpInterceptor
            const response = await loadingManager.wrapPromise(
                httpInterceptor.fetch(`newsletter/subscribers?${queryParams.toString()}`),
                { loadingText: 'Cargando suscriptores...' }
            );

            if (response.status === 'success' && response.data) {
                this.renderTable(response.data.items);
                this.updatePagination(response.data.pagination);
            } else {
                throw new Error(response.message || 'Error cargando suscriptores');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error al cargar los suscriptores');
        }
    }

    renderTable(items) {
        if (!items || items.length === 0) {
            if (this.tableBody) {
                this.tableBody.innerHTML = '';
            }
            if (this.emptyState) {
                this.emptyState.classList.remove('hidden');
            }
            return;
        }

        if (this.emptyState) {
            this.emptyState.classList.add('hidden');
        }

        if (this.tableBody) {
            this.tableBody.innerHTML = items.map(item => this.createTableRow(item)).join('');

            // Añadir event listeners a los botones de acción
            this.tableBody.querySelectorAll('.action-button').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const action = e.currentTarget.dataset.action;
                    const id = e.currentTarget.dataset.id;
                    await this.handleAction(action, id);
                });
            });
        }
    }

    createTableRow(item) {
        const statusClass = item.status === 'active' ?
            'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800';

        const statusText = item.status === 'active' ? 'Activo' : 'Dado de baja';
        const subscribedDate = new Date(item.subscribedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const unsubscribedDate = item.unsubscribedAt ?
            new Date(item.unsubscribedAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';

        return `
            <tr class="hover:bg-purple-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${item.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${subscribedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${unsubscribedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="action-button text-purple-600 hover:text-purple-900 transition-colors duration-150"
                            data-action="${item.status === 'active' ? 'deactivate' : 'activate'}"
                            data-id="${item.id}">
                        ${item.status === 'active' ? 'Dar de baja' : 'Activar'}
                    </button>
                </td>
            </tr>
        `;
    }

    updatePagination(pagination) {
        if (!this.paginationInfo) return;

        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(pagination.page * pagination.limit, pagination.total);

        this.paginationInfo.innerHTML = `
            Mostrando <span class="font-medium">${start}</span>
            a <span class="font-medium">${end}</span>
            de <span class="font-medium">${pagination.total}</span> resultados
        `;

        // Actualizar estado de los botones
        if (this.prevButton) {
            this.prevButton.disabled = pagination.page === 1;
            this.prevButton.classList.toggle('opacity-50', pagination.page === 1);
            this.prevButton.classList.toggle('cursor-not-allowed', pagination.page === 1);
        }

        if (this.nextButton) {
            this.nextButton.disabled = pagination.page === pagination.pages;
            this.nextButton.classList.toggle('opacity-50', pagination.page === pagination.pages);
            this.nextButton.classList.toggle('cursor-not-allowed', pagination.page === pagination.pages);
        }
    }

    async handleAction(action, id) {
        try {
            const response = await httpInterceptor.fetch(`newsletter/subscribers/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: action === 'activate' ? 'active' : 'unsubscribed'
                }),
                loadingText: action === 'activate' ? 'Activando suscriptor...' : 'Dando de baja suscriptor...'
            });

            if (response.status === 'success') {
                await this.loadData();
                notificationManager.show({
                    type: 'success',
                    title: action === 'activate' ? 'Suscriptor Activado' : 'Suscriptor Dado de Baja',
                    message: action === 'activate'
                        ? 'El suscriptor ha sido activado exitosamente.'
                        : 'El suscriptor ha sido dado de baja exitosamente.'
                });
            } else {
                throw new Error(response.message || 'Error actualizando suscriptor');
            }
        } catch (error) {
            console.error('Error handling action:', error);
            notificationManager.show({
                type: 'error',
                title: 'Error',
                message: 'Error al actualizar el suscriptor. Por favor, intenta nuevamente.'
            });
        }
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            if (show) {
                this.loadingOverlay.style.display = 'flex';
                setTimeout(() => {
                    this.loadingOverlay.style.opacity = '1';
                }, 0);
            } else {
                this.loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    this.loadingOverlay.style.display = 'none';
                }, 300); // Dar tiempo para la animación
            }
        }
    }

    showError(message) {
        // Aquí puedes implementar tu sistema de notificaciones
        alert(message); // Temporalmente usando alert
    }

    showSuccess(message) {
        // Aquí puedes implementar tu sistema de notificaciones
        alert(message); // Temporalmente usando alert
    }
}