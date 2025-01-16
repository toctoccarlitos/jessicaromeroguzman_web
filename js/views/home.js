export class HomeView {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Aquí puedes inicializar datos de las tarjetas si lo necesitas
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing home view:', error);
        }
    }
}