/* ===================================
   PROJECT ZURICH - ADMIN JAVASCRIPT
   Link generation and analytics management
   =================================== */

(function() {
    'use strict';

    // DOM Elements
    const emailList = document.getElementById('emailList');
    const detailedList = document.getElementById('detailedList');
    const emailCount = document.getElementById('emailCount');
    const generateLinks = document.getElementById('generateLinks');
    const csvFile = document.getElementById('csvFile');
    const fileDropZone = document.getElementById('fileDropZone');
    const uploadCSV = document.getElementById('uploadCSV');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const copyAllLinks = document.getElementById('copyAllLinks');
    const downloadCSV = document.getElementById('downloadCSV');
    const emailTemplate = document.getElementById('emailTemplate');
    const emailTemplateModal = document.getElementById('emailTemplateModal');
    const closeModal = document.querySelector('.close-modal');
    const copyTemplate = document.getElementById('copyTemplate');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationClose = document.querySelector('.notification-close');

    // State
    let generatedLinks = [];
    let currentAnalytics = {
        activeLinks: 0,
        totalViews: 0,
        uniqueVisitors: 0,
        avgSessionTime: '0m 0s',
        totalDownloads: 0,
        ndaConversion: '0%'
    };

    // Initialize
    function init() {
        bindEvents();
        loadAnalytics();
        setupFileUpload();
        updateEmailCount();
    }

    // Event Listeners
    function bindEvents() {
        // Email list textarea
        if (emailList) {
            emailList.addEventListener('input', updateEmailCount);
        }

        if (detailedList) {
            detailedList.addEventListener('input', updateEmailCount);
        }

        // Generate links button
        if (generateLinks) {
            generateLinks.addEventListener('click', handleGenerateLinks);
        }

        // CSV upload
        if (uploadCSV) {
            uploadCSV.addEventListener('click', handleCSVUpload);
        }

        // Results actions
        if (copyAllLinks) {
            copyAllLinks.addEventListener('click', handleCopyAllLinks);
        }

        if (downloadCSV) {
            downloadCSV.addEventListener('click', handleDownloadCSV);
        }

        if (emailTemplate) {
            emailTemplate.addEventListener('click', openEmailTemplate);
        }

        // Modal events
        if (closeModal) {
            closeModal.addEventListener('click', closeEmailTemplate);
        }

        if (copyTemplate) {
            copyTemplate.addEventListener('click', handleCopyTemplate);
        }

        // Notification close
        if (notificationClose) {
            notificationClose.addEventListener('click', closeNotification);
        }

        // Outside modal click
        if (emailTemplateModal) {
            emailTemplateModal.addEventListener('click', function(e) {
                if (e.target === emailTemplateModal) {
                    closeEmailTemplate();
                }
            });
        }

        // Periodic analytics refresh
        setInterval(loadAnalytics, 30000); // Every 30 seconds
    }

    // Update Email Count
    function updateEmailCount() {
        let count = 0;
        
        if (detailedList && detailedList.value.trim()) {
            const lines = detailedList.value.trim().split('\n').filter(line => line.trim());
            count = lines.length;
        } else if (emailList && emailList.value.trim()) {
            const emails = emailList.value.trim().split('\n').filter(line => line.trim());
            count = emails.length;
        }
        
        if (emailCount) {
            emailCount.textContent = `${count} emails detected`;
        }
    }

    // Generate Token
    function generateToken() {
        return 'zrch_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    // Parse Email Input
    function parseEmailInput() {
        const visitors = [];
        
        // Check if detailed list is used
        if (detailedList && detailedList.value.trim()) {
            const lines = detailedList.value.trim().split('\n');
            lines.forEach(line => {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length >= 1 && parts[0].includes('@')) {
                    visitors.push({
                        email: parts[0],
                        name: parts[1] || '',
                        company: parts[2] || '',
                        token: generateToken(),
                        status: 'active',
                        created_at: new Date().toISOString(),
                        access_count: 0
                    });
                }
            });
        } else if (emailList && emailList.value.trim()) {
            const emails = emailList.value.trim().split('\n');
            emails.forEach(email => {
                email = email.trim();
                if (email.includes('@')) {
                    visitors.push({
                        email: email,
                        name: '',
                        company: '',
                        token: generateToken(),
                        status: 'active',
                        created_at: new Date().toISOString(),
                        access_count: 0
                    });
                }
            });
        }
        
        return visitors;
    }

    // Handle Generate Links
    async function handleGenerateLinks() {
        const visitors = parseEmailInput();
        
        if (visitors.length === 0) {
            showNotification('Please enter at least one valid email address', 'error');
            return;
        }

        // Show loading state
        generateLinks.disabled = true;
        generateLinks.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Links...';

        try {
            // Save visitors to database
            for (const visitor of visitors) {
                await fetch('/tables/visitors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(visitor)
                });
            }

            // Generate links with proper base URL
            const baseURL = window.location.origin;
            generatedLinks = visitors.map(visitor => ({
                ...visitor,
                link: `${baseURL}/index.html?token=${visitor.token}`
            }));

            displayGeneratedLinks();
            showNotification(`Successfully generated ${visitors.length} unique links!`, 'success');
            loadAnalytics(); // Refresh analytics
            
            // Clear inputs
            if (emailList) emailList.value = '';
            if (detailedList) detailedList.value = '';
            updateEmailCount();

        } catch (error) {
            console.error('Error generating links:', error);
            showNotification('Error generating links. Please try again.', 'error');
        } finally {
            // Reset button
            generateLinks.disabled = false;
            generateLinks.innerHTML = '<i class="fas fa-magic"></i> Generate Unique Links';
        }
    }

    // Display Generated Links
    function displayGeneratedLinks() {
        if (!resultsContainer || !resultsTableBody) return;

        resultsContainer.style.display = 'block';
        resultsTableBody.innerHTML = '';

        generatedLinks.forEach((link, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${link.email}</td>
                <td>${link.name || '-'}</td>
                <td>${link.company || '-'}</td>
                <td class="link-cell">
                    <span title="${link.link}">${link.link}</span>
                </td>
                <td class="token-cell">${link.token}</td>
                <td>
                    <span class="status-badge status-${link.status}">${link.status}</span>
                </td>
                <td>
                    <button class="btn-action" onclick="copyLink('${link.link}')">
                        <i class="fas fa-copy"></i>
                        Copy
                    </button>
                </td>
            `;
            resultsTableBody.appendChild(row);
        });
    }

    // Copy individual link
    window.copyLink = function(link) {
        navigator.clipboard.writeText(link).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    };

    // Handle Copy All Links
    function handleCopyAllLinks() {
        if (generatedLinks.length === 0) {
            showNotification('No links to copy', 'error');
            return;
        }

        const linkText = generatedLinks.map(link => 
            `${link.email}: ${link.link}`
        ).join('\n');

        navigator.clipboard.writeText(linkText).then(() => {
            showNotification('All links copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy links', 'error');
        });
    }

    // Handle Download CSV
    function handleDownloadCSV() {
        if (generatedLinks.length === 0) {
            showNotification('No links to download', 'error');
            return;
        }

        const csvContent = [
            ['Email', 'Name', 'Company', 'Token', 'Link', 'Status', 'Created'],
            ...generatedLinks.map(link => [
                link.email,
                link.name || '',
                link.company || '',
                link.token,
                link.link,
                link.status,
                new Date(link.created_at).toLocaleString()
            ])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-zurich-links-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('CSV file downloaded!', 'success');
    }

    // File Upload Setup
    function setupFileUpload() {
        if (!fileDropZone || !csvFile) return;

        // Click to upload
        fileDropZone.addEventListener('click', () => csvFile.click());

        // Drag and drop
        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('dragover');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                csvFile.files = files;
                processCSVFile(files[0]);
            }
        });

        csvFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processCSVFile(e.target.files[0]);
            }
        });
    }

    // Process CSV File
    function processCSVFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                
                if (lines.length === 0) {
                    showNotification('CSV file is empty', 'error');
                    return;
                }

                // Parse CSV (simple implementation)
                const data = lines.map(line => {
                    const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
                    return columns;
                });

                // Skip header if it exists
                const startIndex = data[0][0].toLowerCase().includes('email') ? 1 : 0;
                const validData = data.slice(startIndex).filter(row => 
                    row.length > 0 && row[0].includes('@')
                );

                // Convert to detailed list format
                const detailedText = validData.map(row => {
                    const email = row[0] || '';
                    const name = row[1] || '';
                    const company = row[2] || '';
                    return [email, name, company].filter(v => v).join(',');
                }).join('\n');

                if (detailedList) {
                    detailedList.value = detailedText;
                    updateEmailCount();
                }

                showNotification(`Loaded ${validData.length} contacts from CSV`, 'success');

            } catch (error) {
                console.error('Error processing CSV:', error);
                showNotification('Error processing CSV file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Handle CSV Upload
    function handleCSVUpload() {
        if (!csvFile.files || csvFile.files.length === 0) {
            showNotification('Please select a CSV file first', 'error');
            return;
        }

        processCSVFile(csvFile.files[0]);
    }

    // Load Analytics
    async function loadAnalytics() {
        try {
            // Load visitors
            const visitorsResponse = await fetch('/tables/visitors');
            const visitorsData = await visitorsResponse.json();
            
            // Load analytics events
            const analyticsResponse = await fetch('/tables/analytics');
            const analyticsData = await analyticsResponse.json();
            
            // Load sessions
            const sessionsResponse = await fetch('/tables/sessions');
            const sessionsData = await sessionsResponse.json();

            // Calculate analytics
            currentAnalytics = calculateAnalytics(visitorsData, analyticsData, sessionsData);
            updateAnalyticsDisplay();
            updateRecentActivity(analyticsData);

        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    // Calculate Analytics
    function calculateAnalytics(visitors, analytics, sessions) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return {
            activeLinks: visitors.data ? visitors.data.filter(v => v.status === 'active').length : 0,
            totalViews: analytics.data ? analytics.data.filter(e => e.event_type === 'page_view').length : 0,
            uniqueVisitors: sessions.data ? sessions.data.length : 0,
            avgSessionTime: sessions.data ? calculateAvgSessionTime(sessions.data) : '0m 0s',
            totalDownloads: analytics.data ? analytics.data.filter(e => e.event_type === 'document_download').length : 0,
            ndaConversion: sessions.data ? calculateNDAConversion(sessions.data) : '0%'
        };
    }

    // Calculate Average Session Time
    function calculateAvgSessionTime(sessions) {
        if (!sessions || sessions.length === 0) return '0m 0s';
        
        const validSessions = sessions.filter(s => s.duration_seconds > 0);
        if (validSessions.length === 0) return '0m 0s';
        
        const avgSeconds = validSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / validSessions.length;
        const minutes = Math.floor(avgSeconds / 60);
        const seconds = Math.floor(avgSeconds % 60);
        
        return `${minutes}m ${seconds}s`;
    }

    // Calculate NDA Conversion
    function calculateNDAConversion(sessions) {
        if (!sessions || sessions.length === 0) return '0%';
        
        const ndaInitiated = sessions.filter(s => s.nda_initiated).length;
        const conversion = (ndaInitiated / sessions.length * 100).toFixed(1);
        
        return `${conversion}%`;
    }

    // Update Analytics Display
    function updateAnalyticsDisplay() {
        const elements = {
            activeLinks: document.getElementById('activeLinks'),
            totalViews: document.getElementById('totalViews'),
            uniqueVisitors: document.getElementById('uniqueVisitors'),
            avgSessionTime: document.getElementById('avgSessionTime'),
            totalDownloads: document.getElementById('totalDownloads'),
            ndaConversion: document.getElementById('ndaConversion')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = currentAnalytics[key];
            }
        });
    }

    // Update Recent Activity
    function updateRecentActivity(analyticsData) {
        const activityList = document.getElementById('activityList');
        if (!activityList || !analyticsData.data) return;

        // Get recent events (last 10)
        const recentEvents = analyticsData.data
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        if (recentEvents.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item placeholder">
                    <i class="fas fa-info-circle"></i>
                    <span>No recent activity. Generate links and share them to see analytics here.</span>
                </div>
            `;
            return;
        }

        activityList.innerHTML = recentEvents.map(event => {
            const icon = getEventIcon(event.event_type);
            const description = getEventDescription(event);
            const time = new Date(event.timestamp).toLocaleString();
            
            return `
                <div class="activity-item">
                    <i class="fas fa-${icon}"></i>
                    <span><strong>${event.visitor_email}</strong> ${description}</span>
                    <small>${time}</small>
                </div>
            `;
        }).join('');
    }

    // Get Event Icon
    function getEventIcon(eventType) {
        const icons = {
            'page_view': 'eye',
            'document_download': 'download',
            'nda_start': 'file-signature',
            'nda_complete': 'check-circle',
            'page_exit': 'sign-out-alt'
        };
        return icons[eventType] || 'circle';
    }

    // Get Event Description
    function getEventDescription(event) {
        const descriptions = {
            'page_view': 'accessed the page',
            'document_download': `downloaded ${JSON.parse(event.event_data || '{}').document || 'document'}`,
            'nda_start': 'started NDA process',
            'nda_complete': 'completed NDA process',
            'page_exit': 'left the page'
        };
        return descriptions[event.event_type] || 'performed an action';
    }

    // Email Template Modal
    function openEmailTemplate() {
        if (emailTemplateModal) {
            emailTemplateModal.style.display = 'block';
        }
    }

    function closeEmailTemplate() {
        if (emailTemplateModal) {
            emailTemplateModal.style.display = 'none';
        }
    }

    // Copy Email Template
    function handleCopyTemplate() {
        const template = `Subject: Exclusive Investment Opportunity - Project ZURICH

Dear [NAME],

We are pleased to present an exclusive investment opportunity in Project ZURICH - a €42M senior financing opportunity for affordable housing development in Madrid's prime Valdebebas area.

Key Investment Highlights:
• €42M total investment amount
• 30-year term with 3-year grace period
• 70% LTC with strong equity coverage
• 251 housing units in prime location
• Predictable cash flows with 97%+ expected occupancy

Please use your personalized link to access the complete investment documentation:
[UNIQUE_LINK]

This confidential link provides access to:
• Detailed project teaser
• Term-sheet with full financial structure
• Complete financial model
• NDA process for due diligence access

Interest confirmation is required before September 30, 2025.

For any questions, please don't hesitate to contact us.

Best regards,
ALTER5 Investment Team`;

        navigator.clipboard.writeText(template).then(() => {
            showNotification('Email template copied to clipboard!', 'success');
            closeEmailTemplate();
        }).catch(() => {
            showNotification('Failed to copy template', 'error');
        });
    }

    // Show Notification
    function showNotification(message, type = 'info') {
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            setTimeout(() => {
                closeNotification();
            }, 5000);
        }
    }

    // Close Notification
    function closeNotification() {
        if (notification) {
            notification.classList.remove('show');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();