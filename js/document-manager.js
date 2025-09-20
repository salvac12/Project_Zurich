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
    // Add download buttons to equity investment pages
    if (window.location.pathname.includes('equity_investment')) {
        const language = window.location.pathname.includes('_en') ? 'en' : 'es';
        
        // Add teaser downloads
        addDocumentDownloadButton('teaser-downloads', 'teaser', language);
        
        // Add term sheet downloads
        addDocumentDownloadButton('termsheet-downloads', 'termsheet', language);
        
        // Add financial model downloads
        addDocumentDownloadButton('model-downloads', 'model', language);
    }
    
    // Add download buttons to senior financing pages
    if (window.location.pathname.includes('senior_financing') || window.location.pathname.includes('project-zurich-equity')) {
        const language = window.location.pathname.includes('_en') ? 'en' : 'es';
        
        // Add relevant documents for debt investment
        addDocumentDownloadButton('debt-teaser-downloads', 'teaser', language);
        addDocumentDownloadButton('debt-termsheet-downloads', 'termsheet', language);
        addDocumentDownloadButton('debt-model-downloads', 'model', language);
    }
});