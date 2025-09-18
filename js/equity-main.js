/* ===================================
   PROJECT ZURICH EQUITY - JAVASCRIPT
   Lightweight version with graceful authentication handling
   =================================== */

(function() {
    'use strict';

    // DOM Elements
    const accessBtn = document.getElementById('accessBtn');
    const ndaModal = document.getElementById('ndaModal');
    const closeModal = document.querySelector('.close');
    const cancelNda = document.getElementById('cancelNda');
    const proceedNda = document.getElementById('proceedNda');
    const documentBtns = document.querySelectorAll('.document-btn, .nav-link[data-doc]');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationClose = document.querySelector('.notification-close');

    // Tracking Variables
    let visitorToken = null;
    let visitorEmail = null;
    let isAuthenticated = false;

    // Initialize
    function init() {
        initializeTracking();
        bindEvents();
    }

    // Event Listeners
    function bindEvents() {
        // Access Investment Button
        if (accessBtn) {
            accessBtn.addEventListener('click', openNDAModal);
        }

        // Modal Close Events
        if (closeModal) {
            closeModal.addEventListener('click', closeNDAModal);
        }

        if (cancelNda) {
            cancelNda.addEventListener('click', closeNDAModal);
        }

        if (proceedNda) {
            proceedNda.addEventListener('click', handleNDAProcess);
        }

        // Document Downloads
        documentBtns.forEach(btn => {
            btn.addEventListener('click', handleDocumentDownload);
        });

        // Close notification
        if (notificationClose) {
            notificationClose.addEventListener('click', function() {
                hideNotification();
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Initialize Tracking System with graceful fallback
    async function initializeTracking() {
        // Check for visitor token in URL
        const urlParams = new URLSearchParams(window.location.search);
        visitorToken = urlParams.get('token');
        
        if (visitorToken) {
            console.log('Token detected:', visitorToken);
            
            try {
                // Try to authenticate with backend
                await loadVisitorInfo();
            } catch (error) {
                console.log('Authentication failed, running in demo mode:', error);
                // Continue without authentication
                isAuthenticated = false;
                visitorEmail = 'demo@example.com';
            }
        } else {
            console.log('No token provided - public access mode');
            isAuthenticated = false;
        }

        // Log page view regardless of authentication
        logPageView();
    }

    // Load Visitor Information with graceful handling
    async function loadVisitorInfo() {
        if (!visitorToken) return;
        
        try {
            const response = await fetch(`/tables/visitors?search=${visitorToken}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const visitor = data.data.find(v => v.token === visitorToken);
                if (visitor) {
                    visitorEmail = visitor.email;
                    isAuthenticated = true;
                    
                    console.log('Visitor authenticated:', visitorEmail);
                    
                    // Update visitor access count
                    try {
                        await fetch(`/tables/visitors/${visitor.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                last_access: new Date().toISOString(),
                                access_count: (visitor.access_count || 0) + 1
                            })
                        });
                    } catch (updateError) {
                        console.log('Could not update visitor count:', updateError);
                    }
                } else {
                    throw new Error('Token not found in database');
                }
            } else {
                throw new Error('No visitor data returned');
            }
        } catch (error) {
            console.log('Visitor authentication failed:', error.message);
            throw error;
        }
    }

    // Log page view (works with or without authentication)
    function logPageView() {
        const pageViewData = {
            token: visitorToken || 'anonymous',
            email: visitorEmail || 'anonymous',
            page: 'project-zurich-equity',
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href
        };

        if (isAuthenticated && visitorToken) {
            // Try to log to database
            logToDatabase('page_view', pageViewData);
        } else {
            // Log to console for development
            console.log('Page view (demo mode):', pageViewData);
        }
    }

    // Log to database with error handling
    async function logToDatabase(eventType, data) {
        try {
            const response = await fetch('/tables/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitor_token: visitorToken,
                    visitor_email: visitorEmail,
                    event_type: eventType,
                    event_data: JSON.stringify(data),
                    session_id: `sess_${Date.now()}`,
                    page_url: window.location.href,
                    user_agent: navigator.userAgent,
                    ip_address: 'unknown'
                })
            });

            if (!response.ok) {
                console.log('Analytics logging failed:', response.status);
            }
        } catch (error) {
            console.log('Could not log to database:', error);
        }
    }

    // Modal Functions
    function openNDAModal() {
        if (ndaModal) {
            ndaModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Log NDA modal open
            if (isAuthenticated) {
                logToDatabase('nda_modal_open', {
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    function closeNDAModal() {
        if (ndaModal) {
            ndaModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    function handleNDAProcess() {
        const message = isAuthenticated 
            ? 'Thank you for your interest! Our team will contact you at ' + visitorEmail + ' to proceed with the NDA.'
            : 'Thank you for your interest! Please contact our investment team to proceed with the NDA process.';
        
        showNotification(message, 'success');
        closeNDAModal();

        // Log NDA process start
        if (isAuthenticated) {
            logToDatabase('nda_process_start', {
                timestamp: new Date().toISOString()
            });
        }
    }

    function handleDocumentDownload(e) {
        e.preventDefault();
        const docType = this.getAttribute('data-doc');
        
        if (isAuthenticated) {
            showNotification(`To access the ${docType} document, please complete the NDA process first.`, 'info');
            logToDatabase('document_request', {
                document_type: docType,
                timestamp: new Date().toISOString()
            });
        } else {
            showNotification(`To access the ${docType} document, please contact our investment team.`, 'info');
        }
    }

    // Notification Functions
    function showNotification(message, type = 'info') {
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            setTimeout(() => {
                hideNotification();
            }, 4000);
        }
    }

    function hideNotification() {
        if (notification) {
            notification.style.display = 'none';
        }
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();