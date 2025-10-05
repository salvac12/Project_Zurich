// API Visitors - Sistema con persistencia en Supabase
// Combina datos demo con visitantes reales generados

const getSupabase = require('../_supabase.js');
const supabase = getSupabase();

// Fallback en memoria si Supabase no está disponible
let realVisitors = [];

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, query, body } = req;
    const { id } = query;

    // Datos demo para mostrar funcionalidad
    const demoVisitors = [
      {
        id: 'demo_1',
        token: 'zrch_demo_001',
        email: 'juan.garcia@pension-fund.com',
        name: 'Juan García (Demo)',
        company: 'Pension Fund España',
        status: 'active',
        access_count: 3,
        first_access: '2024-09-18T10:30:00Z',
        last_access: '2024-09-18T14:30:00Z',
        created_at: '2024-09-18T10:30:00Z'
      },
      {
        id: 'demo_2',
        token: 'zrch_demo_002',
        email: 'maria.lopez@family-office.es',
        name: 'María López (Demo)',
        company: 'Family Office Madrid',
        status: 'active',
        access_count: 2,
        first_access: '2024-09-18T09:15:00Z',
        last_access: '2024-09-18T11:45:00Z',
        created_at: '2024-09-18T09:15:00Z'
      }
    ];

    // Combinar datos demo + datos reales
    const allVisitors = [...demoVisitors, ...realVisitors];

    switch (method) {
      case 'GET':
        if (id) {
          // Obtener visitante específico
          const visitor = allVisitors.find(v => v.id === id);
          if (!visitor) {
            return res.status(404).json({ error: 'Visitor not found' });
          }
          res.status(200).json(visitor);
        } else {
          // Listar visitantes con paginación
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 100;
          const search = query.search || '';
          
          // Intentar obtener de Supabase primero
          if (supabase.enabled) {
            try {
              const offset = (page - 1) * limit;
              const filters = { limit, offset };
              if (search) filters.search = search;
              
              const supabaseVisitors = await supabase.getVisitors(filters);
              
              console.log(`📊 Returning ${supabaseVisitors.length} visitors from Supabase`);
              
              res.status(200).json({
                data: supabaseVisitors,
                total: supabaseVisitors.length,
                page,
                limit,
                table: 'visitors',
                source: 'supabase'
              });
              return;
            } catch (error) {
              console.error('Supabase query error, falling back to memory:', error.message);
            }
          }
          
          // Fallback a memoria + demos
          let filteredVisitors = allVisitors;
          
          if (search) {
            filteredVisitors = allVisitors.filter(visitor => 
              visitor.email?.toLowerCase().includes(search.toLowerCase()) ||
              visitor.name?.toLowerCase().includes(search.toLowerCase()) ||
              visitor.company?.toLowerCase().includes(search.toLowerCase()) ||
              visitor.token?.toLowerCase().includes(search.toLowerCase())
            );
          }
          
          const start = (page - 1) * limit;
          const paginatedVisitors = filteredVisitors.slice(start, start + limit);
          
          console.log(`📊 Returning ${paginatedVisitors.length} visitors (${realVisitors.length} real, ${demoVisitors.length} demo)`);
          
          res.status(200).json({
            data: paginatedVisitors,
            total: filteredVisitors.length,
            page,
            limit,
            table: 'visitors',
            real_count: realVisitors.length,
            demo_count: demoVisitors.length,
            source: 'memory'
          });
        }
        break;

      case 'POST':
        // Crear nuevo visitante REAL
        const newVisitor = {
          id: `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: body.email || '',
          token: body.token || '',
          name: body.name || '',
          company: body.company || '',
          status: body.status || 'active',
          access_count: parseInt(body.access_count) || 0,
          first_access: body.first_access || null,
          last_access: body.last_access || null,
          created_at: new Date().toISOString()
        };
        
        // Intentar guardar en Supabase primero
        if (supabase.enabled) {
          try {
            const saved = await supabase.createVisitor(newVisitor);
            console.log('✅ Visitor saved to Supabase:', {
              id: saved[0]?.id,
              email: newVisitor.email,
              token: newVisitor.token.substring(0, 8) + '...'
            });
            res.status(201).json(saved[0]);
            return;
          } catch (error) {
            console.error('❌ Supabase save error, falling back to memory:', error.message);
          }
        }
        
        // Fallback a memoria
        realVisitors.push(newVisitor);
        
        console.log('✅ New REAL visitor created (memory):', {
          id: newVisitor.id,
          email: newVisitor.email,
          token: newVisitor.token.substring(0, 8) + '...',
          total: realVisitors.length
        });
        
        res.status(201).json(newVisitor);
        break;

      case 'PATCH':
      case 'PUT':
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }
        
        // Buscar en visitantes reales
        const visitorIndex = realVisitors.findIndex(v => v.id === id);
        if (visitorIndex !== -1) {
          realVisitors[visitorIndex] = { 
            ...realVisitors[visitorIndex], 
            ...body,
            updated_at: new Date().toISOString()
          };
          
          console.log('✅ Real visitor updated:', {
            id: id,
            email: realVisitors[visitorIndex].email,
            access_count: realVisitors[visitorIndex].access_count
          });
          
          res.status(200).json(realVisitors[visitorIndex]);
        } else {
          // Demo visitor (solo simulamos actualización)
          const demoVisitor = demoVisitors.find(v => v.id === id);
          if (demoVisitor) {
            res.status(200).json({ ...demoVisitor, ...body });
          } else {
            return res.status(404).json({ error: 'Visitor not found' });
          }
        }
        break;

      case 'DELETE':
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }
        
        const deleteIndex = realVisitors.findIndex(v => v.id === id);
        if (deleteIndex !== -1) {
          realVisitors.splice(deleteIndex, 1);
          console.log('✅ Real visitor deleted:', id);
        }
        
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}