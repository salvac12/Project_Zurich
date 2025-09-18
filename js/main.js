/* ===================================
   PROJECT ZURICH - JAVASCRIPT (NO SCROLL EFFECTS)
   Functionality for institutional investment platform
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
    let sessionId = null;
    let sessionStartTime = null;
    let scrollPercentage = 0;
    let documentsDownloaded = [];

    // Document URLs for real downloads
    const documentUrls = {
        'teaser': 'documents/Project-ZURICH-Teaser-ENG.docx',
        'termsheet': 'documents/Project-Ederson-TermSheet-ENG.docx',
        'modelo': 'documents/Financial-Model-Valdebebas.xlsx'
    };

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
            proceedNda.addEventListener('click', handleNDAProceed);
        }

        // Close modal on outside click
        if (ndaModal) {
            ndaModal.addEventListener('click', function(e) {
                if (e.target === ndaModal) {
                    closeNDAModal();
                }
            });
        }

        // Document Download Buttons (both in documents section and navigation)
        documentBtns.forEach(btn => {
            btn.addEventListener('click', handleDocumentDownload);
        });

        // Notification Close
        if (notificationClose) {
            notificationClose.addEventListener('click', closeNotification);
        }

        // Keyboard Events
        document.addEventListener('keydown', handleKeyDown);
    }

    // Open NDA Modal
    function openNDAModal() {
        if (ndaModal) {
            ndaModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            setTimeout(() => {
                const firstFocusable = ndaModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 100);
        }
    }

    // Close NDA Modal
    function closeNDAModal() {
        if (ndaModal) {
            ndaModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Return focus to access button
            if (accessBtn) {
                accessBtn.focus();
            }
        }
    }

    // Handle NDA Proceed
    function handleNDAProceed() {
        // Track NDA start
        if (visitorToken) {
            documentsDownloaded.push('nda');
            trackEvent('nda_start', {
                timestamp: new Date().toISOString()
            });
        }
        
        // Simulate NDA process
        showNotification('Redirecting to NDA signature process...', 'success');
        
        // Close modal after short delay
        setTimeout(() => {
            closeNDAModal();
            
            // Simulate redirect
            setTimeout(() => {
                showNotification('NDA process initiated. You will receive instructions via email.', 'info');
            }, 1500);
        }, 1000);
    }

    // Handle Document Downloads - Real File Downloads
    function handleDocumentDownload(e) {
        e.preventDefault();
        
        const docType = this.getAttribute('data-doc');
        const docNames = {
            'teaser': 'Project ZURICH Teaser',
            'termsheet': 'Project Ederson Term-Sheet',
            'modelo': 'Financial Model Valdebebas'
        };
        
        const docName = docNames[docType] || 'Document';
        const docUrl = documentUrls[docType];
        
        if (docUrl) {
            // Show download notification
            showNotification(`Downloading ${docName}...`, 'success');
            
            // Create download link and trigger download
            const link = document.createElement('a');
            link.href = docUrl;
            link.download = getFileName(docType);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Track the download for analytics
            if (visitorToken) {
                documentsDownloaded.push(docType);
                trackEvent('document_download', {
                    document: docName,
                    document_type: docType,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Track the download (original analytics)
            trackEvent('document_download', {
                document_type: docType,
                document_name: docName,
                project: 'zurich'
            });
        } else {
            showNotification(`Document ${docName} not available`, 'error');
        }
        
        // Add download animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    }

    // Get proper file name for download
    function getFileName(docType) {
        const fileNames = {
            'teaser': 'Project-ZURICH-Teaser-ENG.docx',
            'termsheet': 'Project-Ederson-TermSheet-ENG.docx',
            'modelo': 'Financial-Model-Valdebebas.xlsx'
        };
        return fileNames[docType] || 'document';
    }

    // Show Notification
    function showNotification(message, type = 'info') {
        if (notification && notificationText) {
            notificationText.textContent = message;
            
            // Add type class for different styles if needed
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            // Auto-hide after 4 seconds
            setTimeout(() => {
                closeNotification();
            }, 4000);
        }
    }

    // Close Notification
    function closeNotification() {
        if (notification) {
            notification.classList.remove('show');
        }
    }

    // Handle Keyboard Events
    function handleKeyDown(e) {
        // Close modal on Escape key
        if (e.key === 'Escape' && ndaModal && ndaModal.style.display === 'block') {
            closeNDAModal();
        }
        
        // Close notification on Escape key
        if (e.key === 'Escape' && notification && notification.classList.contains('show')) {
            closeNotification();
        }
    }

    // Analytics and Tracking (placeholder)
    function trackEvent(eventName, properties = {}) {
        // This would integrate with your analytics platform
        console.log('Track Event:', eventName, properties);
        
        // Example for Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
    }

    // Track user interactions
    function setupAnalytics() {
        // Track document downloads
        documentBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const docType = this.getAttribute('data-doc');
                trackEvent('document_download_attempt', {
                    document_type: docType,
                    project: 'zurich',
                    source: this.classList.contains('nav-link') ? 'navigation' : 'documents_section'
                });
            });
        });

        // Track NDA modal opens
        if (accessBtn) {
            accessBtn.addEventListener('click', function() {
                trackEvent('nda_modal_open', {
                    project: 'zurich'
                });
            });
        }

        // Track NDA proceeds
        if (proceedNda) {
            proceedNda.addEventListener('click', function() {
                trackEvent('nda_proceed', {
                    project: 'zurich'
                });
            });
        }
    }

    // Error Handling
    window.addEventListener('error', function(e) {
        console.error('JavaScript Error:', e.error);
        showNotification('A technical error has occurred. Please reload the page.', 'error');
    });

    // Accessibility Enhancements
    function enhanceAccessibility() {
        // Add ARIA labels where needed
        const accessBtn = document.getElementById('accessBtn');
        if (accessBtn) {
            accessBtn.setAttribute('aria-describedby', 'access-description');
        }

        // Add focus indicators
        const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        focusableElements.forEach(element => {
            element.addEventListener('focus', function() {
                this.style.outline = '2px solid #1a1a1a';
                this.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', function() {
                this.style.outline = 'none';
            });
        });
    }

    // Page Load Performance
    function measurePerformance() {
        window.addEventListener('load', function() {
            // Measure page load time
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log('Page Load Time:', loadTime + 'ms');
            
            // Track performance if analytics is available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'timing_complete', {
                    name: 'page_load',
                    value: loadTime
                });
            }
        });
    }

    // File size check for downloads
    function checkFileAvailability() {
        Object.keys(documentUrls).forEach(docType => {
            const url = documentUrls[docType];
            fetch(url, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Document ${docType} may not be available:`, response.status);
                    } else {
                        console.log(`Document ${docType} is available (${response.headers.get('content-length')} bytes)`);
                    }
                })
                .catch(error => {
                    console.warn(`Could not check availability of ${docType}:`, error);
                });
        });
    }

    // Initialize Tracking System
    function initializeTracking() {
        // Check for visitor token in URL
        const urlParams = new URLSearchParams(window.location.search);
        visitorToken = urlParams.get('token');
        
        if (visitorToken) {
            sessionId = generateSessionId();
            sessionStartTime = Date.now();
            
            // Load visitor information
            loadVisitorInfo();
            
            // Track page view
            trackEvent('page_view', {
                page_url: window.location.href,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
            
            // Setup tracking listeners
            setupTrackingListeners();
            
            // Track page exit
            window.addEventListener('beforeunload', trackPageExit);
        }
    }

    // Generate Session ID
    function generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    // Load Visitor Information
    async function loadVisitorInfo() {
        if (!visitorToken) return;
        
        try {
            const response = await fetch(`/tables/visitors?search=${visitorToken}`);
            
            // Check if we can access the tables system
            if (response.status === 404 || response.status === 401 || !response.ok) {
                console.log('Tables system not available - running in demo mode');
                // Set demo mode - page works without authentication
                visitorEmail = 'demo@example.com';
                return;
            }
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const visitor = data.data.find(v => v.token === visitorToken);
                if (visitor) {
                    visitorEmail = visitor.email;
                    
                    // Update visitor access count and last access
                    await fetch(`/tables/visitors/${visitor.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            last_access: new Date().toISOString(),
                            access_count: (visitor.access_count || 0) + 1,
                            ...(visitor.first_access ? {} : { first_access: new Date().toISOString() })
                        })
                    });
                }
            } else {
                // Token not found but tables are available - this is a real authentication issue
                console.log('Token not found in database');
                visitorEmail = null;
            }
        } catch (error) {
            console.log('Tables system not available - running in demo mode');
            // Set demo mode - page works without authentication
            visitorEmail = 'demo@example.com';
        }
    }

    // Setup Tracking Listeners
    function setupTrackingListeners() {
        // Scroll tracking
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const currentScrollPercentage = Math.round((scrollTop / scrollHeight) * 100);
                
                // Track scroll milestones
                const milestones = [25, 50, 75, 90];
                milestones.forEach(milestone => {
                    if (currentScrollPercentage >= milestone && scrollPercentage < milestone) {
                        trackEvent('scroll_milestone', {
                            percentage: milestone,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
                
                scrollPercentage = Math.max(scrollPercentage, currentScrollPercentage);
            }, 100);
        });
        
        // Time milestones
        const timeIntervals = [30, 60, 120, 300]; // seconds
        timeIntervals.forEach(interval => {
            setTimeout(() => {
                if (sessionStartTime) { // Check if user is still on page
                    trackEvent('time_milestone', {
                        seconds: interval,
                        timestamp: new Date().toISOString()
                    });
                }
            }, interval * 1000);
        });
    }

    // Track Event
    async function trackEvent(eventType, eventData = {}) {
        if (!visitorToken || !visitorEmail) return;
        
        try {
            const event = {
                visitor_token: visitorToken,
                visitor_email: visitorEmail,
                event_type: eventType,
                event_data: JSON.stringify(eventData),
                session_id: sessionId,
                page_url: window.location.href,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
            
            await fetch('/tables/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

    // Track Page Exit
    async function trackPageExit() {
        if (!sessionStartTime) return;
        
        const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
        
        // Track page exit event
        trackEvent('page_exit', {
            session_duration: sessionDuration,
            max_scroll_percentage: scrollPercentage,
            documents_downloaded: documentsDownloaded,
            timestamp: new Date().toISOString()
        });
        
        // Save session data
        try {
            await fetch('/tables/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitor_token: visitorToken,
                    visitor_email: visitorEmail,
                    session_start: new Date(sessionStartTime).toISOString(),
                    session_end: new Date().toISOString(),
                    duration_seconds: sessionDuration,
                    page_views: 1, // Simple implementation
                    documents_downloaded: documentsDownloaded,
                    nda_initiated: documentsDownloaded.includes('nda'),
                    max_scroll_percentage: scrollPercentage
                })
            });
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // Update Analytics Counters
    function updateAnalyticsCounters(eventType) {
        let analytics = JSON.parse(localStorage.getItem('zurich_analytics') || '{}');
        
        switch(eventType) {
            case 'page_view':
                analytics.totalVisits = (analytics.totalVisits || 0) + 1;
                break;
            case 'document_download':
                analytics.totalDownloads = (analytics.totalDownloads || 0) + 1;
                break;
            case 'nda_start':
                analytics.ndaStarts = (analytics.ndaStarts || 0) + 1;
                break;
        }
        
        localStorage.setItem('zurich_analytics', JSON.stringify(analytics));
    }

    // Display tracking status for visitors with tokens
    function showTrackingStatus() {
        if (visitorToken) {
            console.log('🔍 Project ZURICH Tracking Active');
            console.log('Token:', visitorToken);
            console.log('Session ID:', sessionId);
            console.log('Visit will be tracked for analytics');
            
            // Optional: Show subtle indicator to user
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #1a1a1a;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 11px;
                z-index: 1000;
                opacity: 0.8;
            `;
            indicator.textContent = 'Analytics Active';
            document.body.appendChild(indicator);
            
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 1000);
            }, 3000);
        }
    }

    // Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            enhanceAccessibility();
            setupAnalytics();
            measurePerformance();
            checkFileAvailability();
            showTrackingStatus();
        });
    } else {
        init();
        enhanceAccessibility();
        setupAnalytics();
        measurePerformance();
        checkFileAvailability();
        showTrackingStatus();
    }

    // Expose public methods if needed
    window.ProjectZurich = {
        showNotification: showNotification,
        trackEvent: trackEvent
    };

})();