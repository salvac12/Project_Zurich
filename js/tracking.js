(function(){
  const ANALYTICS_ENDPOINT = '/api/analytics-real';

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

    function trackEl(el, src) {
      el.addEventListener('click', function(e){
        const explicit = el.getAttribute('data-file_type') || el.dataset.file_type;
        const inferred = normalizeTypeFromText(el.textContent || el.innerText);
        const file_type = explicit || inferred;
        const href = (el.getAttribute('href') || '');
        const label = (el.textContent || el.innerText || '').trim();
        postJSON(ANALYTICS_ENDPOINT, {
          eventType: 'download',
          visitorToken: token,
          data: { file_type, source: src, page: currentPageId(), href, label }
        });
      }, { capture: true });
    }

    docButtons.forEach(el => trackEl(el, 'doc-button'));
    navLinks.forEach(el => trackEl(el, 'nav-link'));
  }

  function bindNDAandCTA(token) {
    // NDA request buttons
    const ndaBtn = document.getElementById('nda-request-btn');
    if (ndaBtn) {
      ndaBtn.addEventListener('click', function(){
        postJSON(ANALYTICS_ENDPOINT, {
          eventType: 'nda_request',
          visitorToken: token,
          data: { signed: false, page: currentPageId() }
        });
      }, { capture: true });
    }

    // CTA button
    const cta = document.querySelector('.cta-button');
    if (cta) {
      cta.addEventListener('click', function(){
        postJSON(ANALYTICS_ENDPOINT, {
          eventType: 'cta_click',
          visitorToken: token,
          data: { page: currentPageId() }
        });
      }, { capture: true });
    }
  }

  function sendPageVisit(token) {
    postJSON(ANALYTICS_ENDPOINT, {
      eventType: 'page_visit',
      visitorToken: token,
      data: { page: currentPageId(), ref: document.referrer || '' }
    });
  }

  function bindSessionEnd(token, startedAt) {
    function sendEnd(){
      const total = Math.round((Date.now() - startedAt)/1000);
      postJSON(ANALYTICS_ENDPOINT, {
        eventType: 'session_end',
        visitorToken: token,
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

  document.addEventListener('DOMContentLoaded', function(){
    const token = resolveToken();
    const start = Date.now();

    // Track initial page visit
    sendPageVisit(token);

    // Bind interactions
    bindDownloadTracking(token);
    bindNDAandCTA(token);

    // Session end tracking
    bindSessionEnd(token, start);
  });
})();
