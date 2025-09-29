#!/usr/bin/env node
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const ROOT = '/home/user/webapp';
const PORT = process.env.PORT ? parseInt(process.env.PORT,10) : 8096;

function contentType(filePath){
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.txt': 'text/plain; charset=utf-8'
    }[ext] || 'application/octet-stream'
  );
}

function toQueryObject(u){
  const q = Object.create(null);
  for (const [k,v] of u.searchParams.entries()) q[k]=v;
  return q;
}

async function parseBody(req){
  return new Promise((resolve) => {
    const chunks=[];
    req.on('data', (c)=> chunks.push(c));
    req.on('end', ()=>{
      const raw = Buffer.concat(chunks).toString('utf8');
      const ct = req.headers['content-type']||'';
      if (ct.includes('application/json')){
        try { resolve(JSON.parse(raw||'{}')); } catch { resolve({}); }
      } else { resolve(raw); }
    });
    req.on('error', ()=> resolve({}));
  });
}

function wrapRes(nodeRes){
  return {
    setHeader: (k,v)=> nodeRes.setHeader(k,v),
    status: (code)=> ({
      json: (obj)=>{ nodeRes.statusCode = code; nodeRes.setHeader('Content-Type','application/json'); nodeRes.end(JSON.stringify(obj)); },
      end: ()=>{ nodeRes.statusCode = code; nodeRes.end(); }
    }),
    json: (obj)=>{ nodeRes.setHeader('Content-Type','application/json'); nodeRes.end(JSON.stringify(obj)); },
    end: ()=> nodeRes.end()
  };
}

async function handleApi(req, res, pathname){
  // CORS preflight universal
  if (req.method === 'OPTIONS'){
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.statusCode = 200; res.end(); return;
  }

  // analytics-real
  if (pathname === '/api/analytics-real'){
    const mod = await import(url.pathToFileURL(path.join(ROOT,'api','analytics-real.js')));
    const u = new URL(req.url, 'http://local');
    const body = await parseBody(req);
    const reqWrap = { method: req.method, query: toQueryObject(u), body };
    const resWrap = wrapRes(res);
    return mod.default(reqWrap, resWrap);
  }

  // tables endpoints: /api/tables/visitors, /api/tables/analytics, /api/tables/sessions
  if (pathname.startsWith('/api/tables/')){
    const tail = pathname.replace('/api/tables/','');
    const file = tail.split('/')[0];
    const filePath = path.join(ROOT,'api','tables', `${file}.js`);
    try {
      await stat(filePath);
      const mod = await import(url.pathToFileURL(filePath));
      const u = new URL(req.url, 'http://local');
      const body = await parseBody(req);
      const reqWrap = { method: req.method, query: toQueryObject(u), body };
      const resWrap = wrapRes(res);
      return mod.default(reqWrap, resWrap);
    } catch {
      res.statusCode = 404; res.end('Not found'); return;
    }
  }

  res.statusCode = 404; res.end('Not found');
}

async function handleStatic(req, res, pathname){
  let filePath = path.join(ROOT, pathname);
  try {
    let st = await stat(filePath);
    if (st.isDirectory()){
      filePath = path.join(filePath, 'index.html');
      st = await stat(filePath);
    }
    const buff = await readFile(filePath);
    res.setHeader('Content-Type', contentType(filePath));
    // Match vercel no-store for .html
    if (filePath.endsWith('.html')){
      res.setHeader('Cache-Control','no-store');
    }
    res.statusCode = 200; res.end(buff);
  } catch {
    // fallback: try index.html for root
    if (pathname === '/' || pathname === ''){
      const idx = path.join(ROOT,'index.html');
      try { const buff = await readFile(idx); res.setHeader('Content-Type','text/html; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(buff); return; } catch {}
    }
    res.statusCode = 404; res.end('Not found');
  }
}

const server = http.createServer(async (req, res)=>{
  try{
    const { pathname } = new URL(req.url, 'http://local');
    if (pathname.startsWith('/api/')){
      await handleApi(req,res,pathname);
      return;
    }
    await handleStatic(req,res,pathname === '/' ? '/index.html' : pathname);
  } catch (e){
    res.statusCode = 500; res.end('Server error');
  }
});

server.listen(PORT, '0.0.0.0', ()=>{
  console.log(`Local Dev Server running on http://0.0.0.0:${PORT}`);
});
