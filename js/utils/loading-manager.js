// js/utils/loading-manager.js
class LoadingManager {
    constructor() {
        this.loadingElement = null;
        this.excludedPages = [
            '/index.html',
            '/login.html',
            '/',
            '/cookies.html',
            '/terminos.html',
            '/politicas.html'
        ];
        this.init();
    }

    init() {
        // Verificar si estamos en una página excluida
        const currentPath = window.location.pathname;
        if (this.isExcludedPage(currentPath)) {
            // Agregar clase al body para páginas excluidas
            document.body.classList.add('no-spinner');
            return;
        }

        // Crear el elemento de loading si no existe
        if (!document.getElementById('global-loading')) {
            const loadingHTML = `
                <div id="global-loading" class="global-loading-overlay">
                    <div class="loading-content">
                        <div class="loading-animation"></div>
                        <p class="loading-text">Cargando...</p>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
            this.loadingElement = document.getElementById('global-loading');
        }
    }

    isExcludedPage(path) {
        return this.excludedPages.some(page =>
            path === page ||
            path === page + '/' ||
            path.startsWith(page + '#')
        );
    }

    show(text = 'Cargando...') {
        // No mostrar el spinner si la página está marcada como no-spinner
        if (document.body.classList.contains('no-spinner')) {
            return;
        }

        if (!this.loadingElement) this.init();

        // Si seguimos en una página excluida después de init(), no mostrar
        if (!this.loadingElement) return;

        const textElement = this.loadingElement.querySelector('.loading-text');
        if (textElement) textElement.textContent = text;

        this.loadingElement.style.display = 'flex';
        setTimeout(() => {
            this.loadingElement.style.opacity = '1';
        }, 0);
    }

    hide() {
        if (!this.loadingElement || document.body.classList.contains('no-spinner')) return;

        this.loadingElement.style.opacity = '0';
        setTimeout(() => {
            this.loadingElement.style.display = 'none';
        }, 300);
    }

    async wrapPromise(promise, options = {}) {
        const {
            showLoading = true,
            loadingText = 'Cargando...',
            minDuration = 300  // Duración mínima del spinner en ms
        } = options;

        // No proceder si estamos en una página excluida
        if (document.body.classList.contains('no-spinner')) {
            return await promise;
        }

        const startTime = Date.now();

        try {
            if (showLoading) this.show(loadingText);
            const result = await promise;

            // Asegurar una duración mínima del spinner para evitar parpadeos
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < minDuration) {
                await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime));
            }

            return result;
        } finally {
            if (showLoading) this.hide();
        }
    }
}

export const loadingManager = new LoadingManager();