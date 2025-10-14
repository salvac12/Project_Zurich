/**
 * Document Manager for Project ZURICH
 * Manages document storage and retrieval for teaser, term sheets, and financial models
 */

class DocumentManager {
    constructor() {
        this.storageKey = 'project_zurich_documents';
        this.documents = this.loadDocuments();
    }

    // Load documents from localStorage
    loadDocuments() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {
                teaser: { es: [], en: [] },
                termsheet: { es: [], en: [] },
                model: { es: [], en: [] }
            };
        } catch (error) {
            console.error('Error loading documents:', error);
            return {
                teaser: { es: [], en: [] },
                termsheet: { es: [], en: [] },
                model: { es: [], en: [] }
            };
        }
    }

    // Save documents to localStorage
    saveDocuments() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.documents));
            return true;
        } catch (error) {
            console.error('Error saving documents:', error);
            return false;
        }
    }

    // Add document
    addDocument(type, language, file, metadata = {}) {
        const fileInfo = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            uploaded: new Date().toISOString(),
            ...metadata
        };

        // Convert file to base64 for storage (for demo purposes - in production use proper file storage)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                fileInfo.data = reader.result;
                this.documents[type][language].push(fileInfo);
                this.saveDocuments();
                resolve(fileInfo);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Remove document
    removeDocument(type, language, documentId) {
        this.documents[type][language] = this.documents[type][language].filter(
            doc => doc.id !== documentId
        );
        this.saveDocuments();
    }

    // Get documents by type and language
    getDocuments(type, language) {
        return this.documents[type][language] || [];
    }

    // Get latest document by type and language
    getLatestDocument(type, language) {
        const docs = this.getDocuments(type, language);
        return docs.length > 0 ? docs[docs.length - 1] : null;
    }

    // Check if document exists
    hasDocument(type, language) {
        return this.getDocuments(type, language).length > 0;
    }

    // Get document download URL
    getDocumentUrl(type, language, documentId) {
        const docs = this.getDocuments(type, language);
        const doc = docs.find(d => d.id === documentId);
        return doc ? doc.data : null;
    }

    // Download document
    downloadDocument(type, language, documentId) {
        const docs = this.getDocuments(type, language);
        const doc = docs.find(d => d.id === documentId);
        
        if (doc) {
            const link = document.createElement('a');
            link.href = doc.data;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        }
        return false;
    }

    // Get all documents summary
    getSummary() {
        const summary = {};
        
        Object.keys(this.documents).forEach(type => {
            summary[type] = {};
            Object.keys(this.documents[type]).forEach(language => {
                summary[type][language] = {
                    count: this.documents[type][language].length,
                    latest: this.getLatestDocument(type, language)?.uploaded || null
                };
            });
        });
        
        return summary;
    }

    // Clear all documents (admin function)
    clearAllDocuments() {
        this.documents = {
            teaser: { es: [], en: [] },
            termsheet: { es: [], en: [] },
            model: { es: [], en: [] }
        };
        this.saveDocuments();
    }

    // Export documents data (for backup)
    exportData() {
        return JSON.stringify(this.documents, null, 2);
    }

    // Import documents data (from backup)
    importData(jsonData) {
        try {
            this.documents = JSON.parse(jsonData);
            this.saveDocuments();
            return true;
        } catch (error) {
            console.error('Error importing documents:', error);
            return false;
        }
    }
}

// Create global instance
window.documentManager = new DocumentManager();

// Helper functions for UI integration
function addDocumentDownloadButton(containerId, type, language, buttonText = 'Download Documents') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const docs = window.documentManager.getDocuments(type, language);
    if (docs.length === 0) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'document-downloads';
    buttonContainer.style.marginTop = '20px';

    docs.forEach(doc => {
        const button = document.createElement('button');
        button.className = 'document-download-btn';
        button.innerHTML = `
            <i class="fas fa-download"></i>
            ${doc.name}
            <span class="file-size">(${formatFileSize(doc.size)})</span>
        `;
        button.style.cssText = `
            background: #1F3A8A;
            color: white;
            border: none;
            padding: 10px 16px;
            margin: 5px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = '#1E3A8A';
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = '#1F3A8A';
            button.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', () => {
            window.documentManager.downloadDocument(type, language, doc.id);
        });

        buttonContainer.appendChild(button);
    });

    container.appendChild(buttonContainer);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document Manager initialized successfully');
    
    // Connect existing buttons to document downloads for equity investment pages
    if (window.location.pathname.includes('equity_investment')) {
        const language = window.location.pathname.includes('_en') ? 'en' : 'es';
        
        // We use native anchors with href+download on equity pages. Do NOT override.
        setTimeout(() => {
            console.log(`Detected equity investment page, language: ${language} — using native anchors (no override)`);
        }, 100);
    }
    
    // Connect buttons for senior financing pages  
    if (window.location.pathname.includes('senior_financing') || window.location.pathname.includes('project-zurich-equity')) {
        const language = window.location.pathname.includes('_en') ? 'en' : 'es';
        
        // Senior pages also rely on native anchors with download; do not override.
        setTimeout(() => {
            console.log(`Detected senior page, language: ${language} — using native anchors (no override)`);
        }, 100);
    }
});

// Connect existing buttons to real documents
function connectExistingButtons(language) {
    console.log('Connecting existing buttons to document downloads...');

    // If the page already has direct download anchors, do not override.
    const hasDirectAnchors = document.querySelector('a[download]');
    if (hasDirectAnchors) {
        console.log('Direct download anchors detected; skipping connectExistingButtons.');
        return;
    }
    
    // Find existing doc-button elements (the blue buttons shown in the images)
    const docButtons = document.querySelectorAll('.doc-button');
    
    docButtons.forEach(button => {
        // Skip anchors that already handle direct downloads via href+download
        if (button.tagName === 'A' && button.hasAttribute('download')) {
            console.log('Skipping direct download button anchor');
            return;
        }
        const buttonText = button.textContent.trim().toLowerCase();
        let documentType = '';
        
        // Determine document type based on button text
        if (buttonText.includes('teaser')) {
            documentType = 'teaser';
        } else if (buttonText.includes('term-sheet') || buttonText.includes('term sheet')) {
            documentType = 'termsheet';
        } else if (buttonText.includes('modelo') || buttonText.includes('financiero') || buttonText.includes('financial')) {
            documentType = 'model';
        }
        
        if (documentType) {
            console.log(`Connecting button for ${documentType} type`);
            
            // Remove any existing click handlers
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add new click handler that downloads real documents
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                downloadRealDocument(documentType, language);
            });
        }
    });
    
    // Also connect navigation links in header
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        // Skip anchors that already handle direct downloads via href+download
        if (link.tagName === 'A' && link.hasAttribute('download')) {
            console.log('Skipping direct download nav link anchor');
            return;
        }
        const linkText = link.textContent.trim().toLowerCase();
        let documentType = '';
        
        if (linkText.includes('teaser')) {
            documentType = 'teaser';
        } else if (linkText.includes('term-sheet') || linkText.includes('term sheet')) {
            documentType = 'termsheet';
        } else if (linkText.includes('modelo') || linkText.includes('financiero') || linkText.includes('financial')) {
            documentType = 'model';
        }
        
        if (documentType) {
            console.log(`Connecting nav link for ${documentType} type`);
            
            // Remove existing click handlers
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Add new click handler
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                downloadRealDocument(documentType, language);
            });
        }
    });
}

// Download real uploaded documents or show message if none available
function downloadRealDocument(type, language) {
    console.log(`Attempting to download ${type} document in ${language}`);
    
    // Get the latest uploaded document for this type and language
    const latestDoc = window.documentManager.getLatestDocument(type, language);
    
    if (latestDoc && latestDoc.data) {
        console.log(`Found real document: ${latestDoc.name}`);
        
        // Create download link for real document
        const link = document.createElement('a');
        link.href = latestDoc.data;
        link.download = latestDoc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showSuccessMessage(`✅ ${latestDoc.name} descargado correctamente`);
        
    } else {
        console.log(`No real document found for ${type} in ${language}, showing message`);
        
        // Show message that no documents are available yet
        const message = language === 'es' 
            ? `📄 ${getDocumentTypeName(type)} no disponible aún. Por favor contacte con nuestro equipo de inversión.`
            : `📄 ${getDocumentTypeName(type)} not available yet. Please contact our investment team.`;
            
        showInfoMessage(message);
    }
}

// Get document type display name
function getDocumentTypeName(type) {
    const names = {
        'teaser': 'Teaser de Inversión / Investment Teaser',
        'termsheet': 'Term Sheet',
        'model': 'Modelo Financiero / Financial Model'
    };
    return names[type] || type;
}

// Show info message (instead of download when no documents available)
function showInfoMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3B82F6;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        font-weight: 600;
        max-width: 350px;
        border-left: 4px solid #1F3A8A;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// DEPRECATED: Demo buttons no longer used - real buttons now connect to actual uploaded documents

// Show success message
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        font-weight: 600;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}