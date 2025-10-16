#!/usr/bin/env node

// Servidor simple para Edge Functions
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8081;
const FUNCTIONS_DIR = path.join(__dirname, 'functions');

// Función para cargar una Edge Function
function loadFunction(functionName) {
    try {
        const functionPath = path.join(FUNCTIONS_DIR, functionName, 'index.ts');
        if (fs.existsSync(functionPath)) {
            // Para desarrollo, simplemente devolvemos una respuesta mock
            return async (req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    function: functionName,
                    message: 'Edge Function ejecutada correctamente (modo desarrollo)',
                    timestamp: new Date().toISOString()
                }));
            };
        }
        return null;
    } catch (error) {
        console.error(`Error cargando función ${functionName}:`, error);
        return null;
    }
}

// Servidor HTTP
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar OPTIONS para CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Health check
    if (pathname === '/health' || pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            message: 'Edge Functions server running',
            timestamp: new Date().toISOString(),
            functions: fs.readdirSync(FUNCTIONS_DIR).filter(f => 
                fs.statSync(path.join(FUNCTIONS_DIR, f)).isDirectory()
            )
        }));
        return;
    }

    // Ruta de Edge Functions: /functions/v1/{function_name}
    const functionMatch = pathname.match(/^\/functions\/v1\/([^\/]+)/);
    if (functionMatch) {
        const functionName = functionMatch[1];
        const handler = loadFunction(functionName);
        
        if (handler) {
            handler(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Function not found',
                function: functionName
            }));
        }
        return;
    }

    // 404 para otras rutas
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: 'Not found',
        path: pathname
    }));
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Edge Functions server running on port ${PORT}`);
    console.log(`📁 Functions directory: ${FUNCTIONS_DIR}`);
    
    // Listar funciones disponibles
    try {
        const functions = fs.readdirSync(FUNCTIONS_DIR).filter(f => 
            fs.statSync(path.join(FUNCTIONS_DIR, f)).isDirectory()
        );
        console.log(`📋 Available functions: ${functions.join(', ')}`);
    } catch (error) {
        console.log('📋 No functions directory found');
    }
});

// Manejo de errores
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down Edge Functions server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down Edge Functions server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
