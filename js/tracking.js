(function(){
  const ANALYTICS_ENDPOINT = '/api/analytics-events';
  const VISITORS_ENDPOINT = '/api/visitors';
  
  let visitorEmail = null; // Cache del email asociado al token

  // Utility: safe fetch with timeout
  function postJSON(url, body) {
    try {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true
      }).catch(()=>{});
    } catch (e) { /* noop */ }
  }
  
  // Buscar email asociado al token
  async function fetchVisitorEmail(token) {
    if (visitorEmail) return visitorEmail; // Ya lo tenemos en cache
    
    try {
      const response = await fetch(`${VISITORS_ENDPOINT}?limit=1000`);
      const result = await response.json();
      const visitors = result.data || result;
      
      const visitor = visitors.find(v => v.token === token);
      if (visitor && visitor.email) {
        visitorEmail = visitor.email;
        return visitorEmail;
      }
    } catch (e) {
      console.warn('Could not fetch visitor email:', e);
    }
    
    return null;
  }

  function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function persistToken(token) {
    try { localStorage.setItem('visitorToken', token); } catch(e) {}
    try { document.cookie = `visitorToken=${token}; path=/; max-age=${60*60*24*365}`; } catch(e) {}
  }

  function getStoredToken() {
    try { const t = localStorage.getItem('visitorToken'); if (t) return t; } catch(e) {}
    try {
      const m = document.cookie.match(/(?:^|; )visitorToken=([^;]+)/);
      if (m) return decodeURIComponent(m[1]);
    } catch(e) {}
    return null;
  }

  function generateAnonToken() {
    return 'anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,10);
  }

  function resolveToken() {
    const qpToken = getParam('token') || getParam('t');
    if (qpToken) { persistToken(qpToken); return qpToken; }
    const stored = getStoredToken();
    if (stored) return stored;
    const anon = generateAnonToken();
    persistToken(anon);
    return anon;
  }

  function currentPageId() {
    const path = window.location.pathname.replace(/^\/+/, '');
    if (!path || path === '') return 'index.html';
    return path;
  }

  function normalizeTypeFromText(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('term')) return 'term-sheet';
    if (t.includes('teaser')) return 'teaser';
    if (t.includes('model') || t.includes('modelo')) return 'financial-model';
    if (t.includes('nda')) return 'nda';
    return 'unknown';
  }

  function bindDownloadTracking(token) {
    const docButtons = Array.from(document.querySelectorAll('.doc-button'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const strategyButtons = Array.from(document.querySelectorAll('.strategy-button'));

    function trackEl(el, src) {
      el.addEventListener('click', async function(e){
        const explicit = el.getAttribute('data-file_type') || el.dataset.file_type;
        const inferred = normalizeTypeFromText(el.textContent || el.innerText);
        const file_type = explicit || inferred;
        const email = await fetchVisitorEmail(token);
        postJSON(ANALYTICS_ENDPOINT, {
          eventType: 'download',
          visitorToken: token,
          visitor_email: email || '',
          data: { file_type, source: src, page: currentPageId() }
        });
      }, { capture: true });
    }

    docButtons.forEach(el => trackEl(el, 'doc-button'));
    navLinks.forEach(el => trackEl(el, 'nav-link'));
    strategyButtons.forEach(el => trackEl(el, 'strategy-button'));
  }

  function bindNDAandCTA(token) {
    // NDA request buttons
    const ndaBtn = document.getElementById('nda-request-btn');
    if (ndaBtn) {
      ndaBtn.addEventListener('click', async function(){
        const email = await fetchVisitorEmail(token);
        postJSON(ANALYTICS_ENDPOINT, {
          eventType: 'nda_request',
          visitorToken: token,
          visitor_email: email || '',
          data: { signed: false, page: currentPageId() }
        });
      }, { capture: true });
    }

    // CTA button
    const cta = document.querySelector('.cta-button');
    if (cta) {
      cta.addEventListener('click', async function(){
        const email = await fetchVisitorEmail(token);
        postJSON(ANALYTICS_ENDPOINT, {
          eventType: 'cta_click',
          visitorToken: token,
          visitor_email: email || '',
          data: { page: currentPageId() }
        });
      }, { capture: true });
    }
  }

  async function sendPageVisit(token) {
    const email = await fetchVisitorEmail(token);
    postJSON(ANALYTICS_ENDPOINT, {
      eventType: 'page_visit',
      visitorToken: token,
      visitor_email: email || '',
      data: { page: currentPageId(), ref: document.referrer || '' }
    });
  }

  function bindSessionEnd(token, startedAt) {
    async function sendEnd(){
      const total = Math.round((Date.now() - startedAt)/1000);
      const email = await fetchVisitorEmail(token);
      postJSON(ANALYTICS_ENDPOINT, {
        eventType: 'session_end',
        visitorToken: token,
        visitor_email: email || '',
        data: { total_time: total, page: currentPageId() }
      });
    }
    window.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'hidden') sendEnd();
    });
    window.addEventListener('beforeunload', function(){
      sendEnd();
    });
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const token = resolveToken();
    const start = Date.now();
    
    // Pre-fetch visitor email for better performance
    await fetchVisitorEmail(token);

    // Track initial page visit
    await sendPageVisit(token);

    // Bind interactions
    bindDownloadTracking(token);
    bindNDAandCTA(token);

    // Session end tracking
    bindSessionEnd(token, start);
  });
})();
