/*Pour l'instant, ce projet ne comprend pas de back-end. Le code actuel se concentre uniquement sur le développement d'un panel stable. Par la suite, j'implémenterai la partie back-end, avec gestion des utilisateurs et récupération des sites via les informations stockées dans la base de données.*/
class HTMLEditor {
    constructor() {
        this.elements = [];
        this.selectedElement = null;
        this.projects = [
            { 
                id: 'default', 
                name: 'Projet par défaut',
                elements: [],
                pageProperties: {
                    title: 'Ma page',
                    description: '',
                    favicon: ''
                }
            }
        ];
        this.currentProject = 'default';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializePreviewFrame();
        this.loadProjects();
        this.updateExistingElements();
    }

    initializePreviewFrame() {
        const frame = document.getElementById('previewFrame');
        frame.contentDocument.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Preview</title>
                    <style>
                        body { 
                            margin: 0;
                            padding: 20px;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        .section {
                            padding: 20px;
                            margin-bottom: 20px;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                        }
                        button {
                            padding: 8px 16px;
                            border-radius: 6px;
                            border: none;
                            cursor: pointer;
                        }
                        button.primary {
                            background: #2563eb;
                            color: white;
                        }
                        button.secondary {
                            background: #e5e7eb;
                            color: #1f2937;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        hr {
                            border: none;
                            border-top: 1px solid #e5e7eb;
                            margin: 20px 0;
                        }
                        .editable {
                            transition: outline 0.2s;
                        }
                        .editable:hover {
                            outline: 2px solid #2563eb;
                            outline-offset: 2px;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body id="content"></body>
            </html>
        `);
        frame.contentDocument.close();

        frame.contentDocument.addEventListener('click', (e) => {
            const element = e.target.closest('.editable');
            if (element) {
                const elementId = element.id;
                const foundElement = this.elements.find(el => el.id === elementId);
                if (foundElement) {
                    this.selectElement(foundElement);
                }
            }
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.add-element').forEach(button => {
            button.addEventListener('click', () => this.addElement(button.dataset.type));
        });

        document.getElementById('viewCode').addEventListener('click', () => this.showCode());
        document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
        document.getElementById('newProject').addEventListener('click', () => this.createNewProject());
        
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('codeModal').style.display = 'none';
        });

        document.getElementById('projectSelect').addEventListener('change', (e) => {
            this.switchProject(e.target.value);
        });

        const pageInputs = ['pageTitle', 'pageDescription', 'pageFavicon'];
        pageInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.updatePageProperty(id.replace('page', '').toLowerCase(), e.target.value);
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('codeModal')) {
                document.getElementById('codeModal').style.display = 'none';
            }
        });
    }

    loadProjects() {
        const savedProjects = localStorage.getItem('htmlEditorProjects');
        if (savedProjects) {
            this.projects = JSON.parse(savedProjects);
            this.updateProjectSelector();
            this.switchProject(this.currentProject);
        }
    }

    saveProject() {
        this.saveCurrentProject();
        alert('Projet sauvegardé !');
    }

    updateProjectSelector() {
        const select = document.getElementById('projectSelect');
        select.innerHTML = this.projects.map(project => 
            `<option value="${project.id}" ${project.id === this.currentProject ? 'selected' : ''}>
                ${project.name}
            </option>`
        ).join('');
    }

    createNewProject() {
        const name = prompt('Nom du nouveau projet:');
        if (name) {
            const id = 'project-' + Date.now();
            this.projects.push({
                id,
                name,
                elements: [],
                pageProperties: {
                    title: 'Nouvelle page',
                    description: '',
                    favicon: ''
                }
            });
            this.updateProjectSelector();
            this.switchProject(id);
            this.saveProjects();
        }
    }

    switchProject(projectId) {
        this.currentProject = projectId;
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.elements = [...project.elements];
            this.selectedElement = null;
            this.updateExistingElements();
            this.updatePageProperties(project.pageProperties);
            this.renderPreview();
        }
    }

    updatePageProperties(properties = {}) {
        document.getElementById('pageTitle').value = properties.title || '';
        document.getElementById('pageDescription').value = properties.description || '';
        document.getElementById('pageFavicon').value = properties.favicon || '';
        
        const frame = document.getElementById('previewFrame');
        frame.contentDocument.title = properties.title || '';
        if (properties.favicon) {
            let favicon = frame.contentDocument.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = frame.contentDocument.createElement('link');
                favicon.rel = 'icon';
                frame.contentDocument.head.appendChild(favicon);
            }
            favicon.href = properties.favicon;
        }
    }

    updatePageProperty(property, value) {
        const project = this.projects.find(p => p.id === this.currentProject);
        if (project) {
            project.pageProperties = project.pageProperties || {};
            project.pageProperties[property] = value;
            this.saveProjects();
            this.updatePageProperties(project.pageProperties);
        }
    }

    saveProjects() {
        localStorage.setItem('htmlEditorProjects', JSON.stringify(this.projects));
    }

    addElement(type) {
        const element = {
            id: 'element-' + Date.now(),
            type,
            content: this.getDefaultContent(type),
            properties: this.getDefaultProperties(type)
        };
        
        this.elements.push(element);
        this.selectElement(element);
        this.updateExistingElements();
        this.renderPreview();
        this.saveCurrentProject();
    }

    getDefaultContent(type) {
        switch (type) {
            case 'section': return '<div>Nouvelle section</div>';
            case 'heading': return 'Nouveau titre';
            case 'text': return 'Nouveau texte';
            case 'button': return 'Nouveau bouton';
            case 'image': return '';
            case 'link': return 'Nouveau lien';
            case 'list': return '<li>Nouvel élément</li>';
            case 'divider': return '';
            default: return '';
        }
    }

    getDefaultProperties(type) {
        const common = {
            className: '',
            id: '',
            style: ''
        };

        switch (type) {
            case 'heading':
                return { ...common, level: 'h2' };
            case 'image':
                return { ...common, src: '', alt: '', width: '', height: '' };
            case 'link':
                return { ...common, href: '#', target: '_self' };
            case 'button':
                return { ...common, variant: 'primary' };
            default:
                return common;
        }
    }

    updateExistingElements() {
        const container = document.getElementById('existing-elements');
        if (this.elements.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun élément</p>';
            return;
        }

        container.innerHTML = this.elements.map(element => `
            <div class="existing-element ${this.selectedElement?.id === element.id ? 'selected' : ''}" 
                 onclick="editor.selectElement(${JSON.stringify(element)})">
                <span>${element.type} - ${this.getElementPreview(element)}</span>
                <button class="btn btn-danger" onclick="event.stopPropagation(); editor.removeElement('${element.id}')">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `).join('');
        
        lucide.createIcons();
    }

    getElementPreview(element) {
        const maxLength = 20;
        let preview = element.content;
        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength) + '...';
        }
        return preview;
    }

    removeElement(id) {
        const index = this.elements.findIndex(el => el.id === id);
        if (index !== -1) {
            if (this.selectedElement?.id === id) {
                this.selectedElement = null;
            }
            this.elements.splice(index, 1);
            this.updateExistingElements();
            this.updatePropertiesPanel();
            this.renderPreview();
            this.saveCurrentProject();
        }
    }

    selectElement(element) {
        this.selectedElement = element;
        this.updateExistingElements();
        this.updatePropertiesPanel();
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        if (!this.selectedElement) {
            panel.innerHTML = `
                <h2>
                    <i data-lucide="sliders"></i>
                    Propriétés de l'élément
                </h2>
                <p class="select-element-message">Sélectionnez un élément pour modifier ses propriétés</p>
            `;
            lucide.createIcons();
            return;
        }

        panel.innerHTML = `
            <h2>
                <i data-lucide="sliders"></i>
                Propriétés de l'élément
            </h2>
            ${this.generatePropertiesForm()}
        `;
        
        lucide.createIcons();
        this.setupPropertyEventListeners();
    }

    generatePropertiesForm() {
        const element = this.selectedElement;
        let specificProperties = '';

        switch (element.type) {
            case 'heading':
                specificProperties = `
                    <div class="property-group">
                        <label>Niveau de titre</label>
                        <select id="headingLevel">
                            ${['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level => 
                                `<option value="${level}" ${element.properties.level === level ? 'selected' : ''}>
                                    ${level.toUpperCase()}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
                break;
            case 'image':
                specificProperties = `
                    <div class="property-group">
                        <label>URL de l'image</label>
                        <input type="text" id="imageSrc" value="${element.properties.src}">
                    </div>
                    <div class="property-group">
                        <label>Texte alternatif</label>
                        <input type="text" id="imageAlt" value="${element.properties.alt}">
                    </div>
                `;
                break;
            case 'link':
                specificProperties = `
                    <div class="property-group">
                        <label>URL du lien</label>
                        <input type="text" id="linkHref" value="${element.properties.href}">
                    </div>
                    <div class="property-group">
                        <label>Cible</label>
                        <select id="linkTarget">
                            <option value="_self" ${element.properties.target === '_self' ? 'selected' : ''}>Même fenêtre</option>
                            <option value="_blank" ${element.properties.target === '_blank' ? 'selected' : ''}>Nouvelle fenêtre</option>
                        </select>
                    </div>
                `;
                break;
            case 'button':
                specificProperties = `
                    <div class="property-group">
                        <label>Variante</label>
                        <select id="buttonVariant">
                            <option value="primary" ${element.properties.variant === 'primary' ? 'selected' : ''}>Primary</option>
                            <option value="secondary" ${element.properties.variant === 'secondary' ? 'selected' : ''}>Secondary</option>
                        </select>
                    </div>
                `;
                break;
        }

        return `
            <div class="element-properties">
                <div class="property-group">
                    <label>Contenu</label>
                    <textarea id="elementContent">${element.content}</textarea>
                </div>
                <div class="property-group">
                    <label>Classes CSS</label>
                    <input type="text" id="elementClass" value="${element.properties.className}">
                </div>
                <div class="property-group">
                    <label>ID</label>
                    <input type="text" id="elementId" value="${element.properties.id}">
                </div>
                ${specificProperties}
            </div>
        `;
    }

    setupPropertyEventListeners() {
        const element = this.selectedElement;
        if (!element) return;

        // Common properties
        document.getElementById('elementContent')?.addEventListener('input', (e) => {
            element.content = e.target.value;
            this.updatePreviewAndSave();
        });

        document.getElementById('elementClass')?.addEventListener('input', (e) => {
            element.properties.className = e.target.value;
            this.updatePreviewAndSave();
        });

        document.getElementById('elementId')?.addEventListener('input', (e) => {
            element.properties.id = e.target.value;
            this.updatePreviewAndSave();
        });

        // Specific properties
        switch (element.type) {
            case 'heading':
                document.getElementById('headingLevel')?.addEventListener('change', (e) => {
                    element.properties.level = e.target.value;
                    this.updatePreviewAndSave();
                });
                break;
            case 'image':
                document.getElementById('imageSrc')?.addEventListener('input', (e) => {
                    element.properties.src = e.target.value;
                    this.updatePreviewAndSave();
                });
                document.getElementById('imageAlt')?.addEventListener('input', (e) => {
                    element.properties.alt = e.target.value;
                    this.updatePreviewAndSave();
                });
                break;
            case 'link':
                document.getElementById('linkHref')?.addEventListener('input', (e) => {
                    element.properties.href = e.target.value;
                    this.updatePreviewAndSave();
                });
                document.getElementById('linkTarget')?.addEventListener('change', (e) => {
                    element.properties.target = e.target.value;
                    this.updatePreviewAndSave();
                });
                break;
            case 'button':
                document.getElementById('buttonVariant')?.addEventListener('change', (e) => {
                    element.properties.variant = e.target.value;
                    this.updatePreviewAndSave();
                });
                break;
        }
    }

    updatePreviewAndSave() {
        this.renderPreview();
        this.saveCurrentProject();
    }

    renderPreview() {
        const frame = document.getElementById('previewFrame');
        const content = frame.contentDocument.getElementById('content');
        
        if (!content) return;

        content.innerHTML = this.elements.map(element => this.renderElement(element)).join('');
    }

    renderElement(element) {
        const { type, content, properties } = element;
        const className = `editable ${properties.className || ''}`.trim();
        
        switch (type) {
            case 'section':
                return `<div class="${className} section" id="${properties.id}">${content}</div>`;
            case 'heading':
                return `<${properties.level || 'h2'} class="${className}" id="${properties.id}">${content}</${properties.level || 'h2'}>`;
            case 'text':
                return `<p class="${className}" id="${properties.id}">${content}</p>`;
            case 'button':
                return `<button class="${className} ${properties.variant}" id="${properties.id}">${content}</button>`;
            case 'image':
                return `<img src="${properties.src}" alt="${properties.alt}" class="${className}" id="${properties.id}" ${properties.width ? `width="${properties.width}"` : ''} ${properties.height ? `height="${properties.height}"` : ''}>`;
            case 'link':
                return `<a href="${properties.href}" target="${properties.target}" class="${className}" id="${properties.id}">${content}</a>`;
            case 'list':
                return `<ul class="${className}" id="${properties.id}">${content}</ul>`;
            case 'divider':
                return `<hr class="${className} divider" id="${properties.id}">`;
            default:
                return '';
        }
    }

    showCode() {
        const modal = document.getElementById('codeModal');
        const codeView = document.getElementById('codeView');
        const frame = document.getElementById('previewFrame');
        
        const project = this.projects.find(p => p.id === this.currentProject);
        const title = project?.pageProperties?.title || 'Ma page';
        const description = project?.pageProperties?.description || '';
        const favicon = project?.pageProperties?.favicon || '';
        
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${description ? `<meta name="description" content="${description}">` : ''}
    ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
    <style>
        ${frame.contentDocument.querySelector('style').textContent}
    </style>
</head>
<body>
    ${frame.contentDocument.body.innerHTML}
</body>
</html>`;
        
        codeView.value = html;
        modal.style.display = 'block';
    }

    saveCurrentProject() {
        const project = this.projects.find(p => p.id === this.currentProject);
        if (project) {
            project.elements = [...this.elements];
            this.saveProjects();
        }
    }
}

const editor = new HTMLEditor();
