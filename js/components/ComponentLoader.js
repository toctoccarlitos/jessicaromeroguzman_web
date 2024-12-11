// components/ComponentLoader.js
export class ComponentLoader {
    constructor() {
        this.components = {
            'footer': './components/footer.html',
            'newsletter-form': './components/shared/forms/newsletter-form.html',
            'contact-form': './components/shared/forms/contact-form.html',
            'social-links': './components/shared/social-links.html',
            'cookie-banner': './components/shared/cookie-banner.html',
            'login-form': './components/shared/forms/login-form.html' 
        };
    }

    async loadComponent(componentName, targetId) {
        if (!this.components[componentName]) {
            console.error(`Componente "${componentName}" no encontrado`);
            return;
        }

        try {
            const response = await fetch(this.components[componentName]);
            if (!response.ok) throw new Error('Error al cargar el componente');
            const html = await response.text();
            document.getElementById(targetId).innerHTML = html;

            // En lugar de eval, creamos y ejecutamos scripts de forma segura
            this.executeComponentScripts(targetId);
        } catch (error) {
            console.error(`Error cargando ${componentName}:`, error);
        }
    }

    executeComponentScripts(targetId) {
        const scripts = document.getElementById(targetId).getElementsByTagName('script');
        Array.from(scripts).forEach(oldScript => {
            const newScript = document.createElement('script');

            // Copiar todos los atributos
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Si es un script inline
            if (oldScript.innerHTML) {
                // En lugar de código dinámico, vamos a manejar casos específicos
                // Por ejemplo, para actualizar el año
                if (oldScript.innerHTML.includes('year')) {
                    newScript.textContent = `document.getElementById('year').textContent = new Date().getFullYear();`;
                }
            }

            // Reemplazar el script viejo con el nuevo
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    init() {
        document.querySelectorAll('[data-component]').forEach(element => {
            const componentName = element.dataset.component;
            this.loadComponent(componentName, element.id);
        });
    }
}