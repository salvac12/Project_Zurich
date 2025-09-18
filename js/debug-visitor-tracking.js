// Script de depuración para el tracking de visitantes
// Añade información de debug en la consola del navegador

(function() {
    console.log('🔍 DEBUG: Visitor Tracking Diagnostics');
    
    // 1. Verificar parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('📍 URL Token:', token || 'No token in URL');
    
    // 2. Verificar localStorage
    const storedToken = localStorage.getItem('visitor_token');
    const storedInfo = localStorage.getItem('visitor_info');
    console.log('💾 Stored Token:', storedToken || 'No stored token');
    console.log('💾 Stored Info:', storedInfo ? JSON.parse(storedInfo) : 'No stored info');
    
    // 3. Verificar variables globales después de que se carguen
    setTimeout(() => {
        console.log('🌍 Global Variables:');
        console.log('   - window.visitorInfo:', window.visitorInfo);
        console.log('   - window.visitorEmail:', window.visitorEmail);
        console.log('   - window.visitorToken:', window.visitorToken);
        console.log('   - window.visitorLookup:', window.visitorLookup);
        console.log('   - window.analytics:', window.analytics);
    }, 2000);
    
    // 4. Interceptar llamadas a fetch para debug
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        if (args[0] && args[0].includes('/tables/visitors')) {
            console.log('🔄 API Call to visitors:', args[0]);
        }
        return originalFetch.apply(this, args)
            .then(response => {
                if (args[0] && args[0].includes('/tables/visitors')) {
                    console.log('✅ API Response:', response.status);
                    // Clone response for debugging
                    const clonedResponse = response.clone();
                    clonedResponse.json().then(data => {
                        console.log('📊 API Data:', data);
                    }).catch(() => {});
                }
                return response;
            });
    };
    
    // 5. Función manual para verificar visitante
    window.debugVisitor = function() {
        console.log('=== VISITOR DEBUG INFO ===');
        console.log('URL Token:', new URLSearchParams(window.location.search).get('token'));
        console.log('Stored Token:', localStorage.getItem('visitor_token'));
        console.log('Stored Info:', localStorage.getItem('visitor_info'));
        console.log('Global visitorInfo:', window.visitorInfo);
        console.log('Global analytics:', window.analytics);
        console.log('=========================');
        
        // Intentar lookup manual
        if (window.visitorLookup) {
            console.log('🔍 Visitor Lookup Instance:', window.visitorLookup);
            console.log('   - Visitor Info:', window.visitorLookup.getVisitorInfo());
            console.log('   - Visitor Email:', window.visitorLookup.getVisitorEmail());
        }
    };
    
    // 6. Función para probar API manualmente
    window.testVisitorsAPI = async function() {
        try {
            console.log('🧪 Testing /tables/visitors API...');
            const response = await fetch('/tables/visitors?limit=5');
            const data = await response.json();
            console.log('✅ API Test Result:', data);
            return data;
        } catch (error) {
            console.error('❌ API Test Failed:', error);
            return null;
        }
    };
    
    // 7. Listener para eventos de analytics
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.analytics) {
                console.log('📈 Analytics Instance Available');
                
                // Override logEvent para debug
                const originalLogEvent = window.analytics.logEvent.bind(window.analytics);
                window.analytics.logEvent = function(eventType, data) {
                    console.log('📊 Analytics Event:', {
                        type: eventType,
                        visitorEmail: this.visitorEmail,
                        visitorToken: this.visitorToken,
                        data: data
                    });
                    return originalLogEvent(eventType, data);
                };
            }
        }, 3000);
    });
    
    // 8. Instrucciones para el usuario
    console.log(`
🔍 VISITOR TRACKING DEBUG LOADED
================================

Para depurar problemas de tracking, usa estos comandos en la consola:

• debugVisitor()      - Ver toda la info del visitante actual
• testVisitorsAPI()   - Probar conexión con la API
• localStorage.clear() - Limpiar datos locales (para pruebas)

Los eventos de analytics aparecerán automáticamente en la consola.
    `);
    
})();