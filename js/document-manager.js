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
    // Document Manager initialized successfully
    
    // Add download buttons to equity investment pages
    if (window.location.pathname.includes('equity_investment')) {
        const language = window.location.pathname.includes('_en') ? 'en' : 'es';
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // Add teaser downloads
            addDocumentDownloadButton('teaser-downloads', 'teaser', language);
            
            // Add term sheet downloads  
            addDocumentDownloadButton('termsheet-downloads', 'termsheet', language);
            
            // Add financial model downloads
            addDocumentDownloadButton('model-downloads', 'model', language);
            
            // If no documents found, add demo buttons
            addDemoButtons();
        }, 500);
    }
    
    // Add download buttons to senior financing pages
    if (window.location.pathname.includes('senior_financing') || window.location.pathname.includes('project-zurich-equity')) {
        const language = window.location.pathname.includes('_en') ? 'en' : 'es';
        
        setTimeout(() => {
            // Add relevant documents for debt investment
            addDocumentDownloadButton('debt-teaser-downloads', 'teaser', language);
            addDocumentDownloadButton('debt-termsheet-downloads', 'termsheet', language); 
            addDocumentDownloadButton('debt-model-downloads', 'model', language);
            
            // If no documents found, add demo buttons
            addDemoButtons();
        }, 100);
    }
});

// Add demo buttons if no real documents are found
function addDemoButtons() {
    const containers = ['teaser-downloads', 'termsheet-downloads', 'model-downloads'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        
        if (container && container.children.length === 0) {
            // No real documents found, add demo button
            const demoButton = document.createElement('button');
            demoButton.className = 'document-download-btn demo-btn';
            demoButton.style.cssText = `
                background: #10B981 !important;
                color: white !important;
                border: none !important;
                padding: 10px 16px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 14px !important;
                transition: all 0.2s !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 8px !important;
                text-decoration: none !important;
                width: 100% !important;
                justify-content: center !important;
                margin: 5px 0 !important;
            `;
            
            let buttonText = '';
            let fileContent = '';
            
            if (containerId.includes('teaser')) {
                buttonText = '📄 Descargar Teaser Demo (PDF)';
                fileContent = `PROJECT ZURICH - INVESTMENT TEASER

EXECUTIVE SUMMARY
=================
Investment Opportunity: EUR 21M Equity Investment
Project: Affordable Housing Development  
Location: Valdebebas, Madrid
Timeline: 32 months
Target IRR: 13.5%

KEY HIGHLIGHTS
==============
• Build-to-Sale strategy with REIT structure
• 251 residential units in prime location
• Tax advantages through SOCIMI structure
• Short-term investment horizon
• Strong developer track record

FINANCIAL OVERVIEW
==================
Total Investment: EUR 21M
Expected Return: 13.5% IRR
Investment Period: 32 months
Exit Strategy: Sale to core investor

For more information, please contact our investment team.

CONTACT
=======
ALTER5 Investment Team
Email: investments@alter5.com
Phone: +34 91 XXX XXXX

---
This is a demonstration document.
Generated: ${new Date().toLocaleDateString()}`;
            } else if (containerId.includes('termsheet')) {
                buttonText = '📊 Descargar Term Sheet Demo';
                fileContent = `PROJECT ZURICH - TERM SHEET

INVESTMENT TERMS
================
Investment Amount: EUR 21,000,000
Security Type: Equity participation via SOCIMI
Target IRR: 13.5% per annum
Investment Period: 32 months
Minimum Investment: EUR 500,000

STRUCTURE
=========
Vehicle: Spanish SOCIMI (REIT)
Strategy: Build-to-Sale
Asset Class: Residential (Affordable Housing)
Location: Valdebebas, Madrid

FINANCIAL PROJECTIONS
=====================
Total Development Cost: EUR 63M
Equity Required: EUR 21M  
Debt Financing: EUR 42M (70% LTC)
Expected Exit Value: EUR 75M
Projected Multiple: 1.55x

KEY TERMS
=========
• Preferred return: 6% per annum
• Profit sharing: 80/20 after preferred return
• Management fee: 1.5% per annum
• Exit timeline: Q1 2029

RISK FACTORS
============
• Construction risk
• Market risk  
• Regulatory risk
• Interest rate risk

---
This is a demonstration document.
Generated: ${new Date().toLocaleDateString()}`;
            } else if (containerId.includes('model')) {
                buttonText = '💰 Descargar Modelo Financiero Demo';
                fileContent = `PROJECT ZURICH - FINANCIAL MODEL SUMMARY

INVESTMENT ASSUMPTIONS
======================
Total Units: 251
Average Sale Price: EUR 298,000
Total Revenue: EUR 74.8M
Construction Cost: EUR 45M
Land Cost: EUR 8M
Total Cost: EUR 63M
Gross Margin: 19%

FINANCING STRUCTURE
===================
Total Investment: EUR 63M
Senior Debt: EUR 42M (70% LTC)
Equity Investment: EUR 21M (30%)
Cost of Debt: 4.25%
Blended Cost of Capital: 9.2%

CASH FLOW PROJECTIONS (EUR M)
==============================
Year 1: Construction (-15M)
Year 2: Construction (-20M)  
Year 3: Sales (+45M)
Total Net Cash Flow: +11.8M
IRR: 13.5%
NPV @ 10%: EUR 2.1M

SENSITIVITY ANALYSIS
====================
Sale Price -10%: IRR 8.2%
Sale Price +10%: IRR 19.1%  
Construction Cost +15%: IRR 9.8%
Timeline +6 months: IRR 11.2%

EXIT SCENARIOS
==============
Scenario 1: Bulk sale to institutional investor
Scenario 2: Individual unit sales
Scenario 3: Hold and refinance (long-term)

---
This is a demonstration financial model.
Generated: ${new Date().toLocaleDateString()}
Contact ALTER5 for full Excel model.`;
            }
            
            demoButton.innerHTML = `<i class="fas fa-download"></i> ${buttonText}`;
            
            demoButton.addEventListener('click', () => {
                // Create and download demo file
                const blob = new Blob([fileContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Project_ZURICH_${containerId.replace('-downloads', '')}_Demo.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Show success message
                showSuccessMessage(`✅ ${buttonText} descargado correctamente`);
            });
            
            demoButton.addEventListener('mouseenter', () => {
                demoButton.style.background = '#059669 !important';
                demoButton.style.transform = 'translateY(-2px)';
            });
            
            demoButton.addEventListener('mouseleave', () => {
                demoButton.style.background = '#10B981 !important';
                demoButton.style.transform = 'translateY(0)';
            });
            
            container.appendChild(demoButton);
        }
    });
}

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