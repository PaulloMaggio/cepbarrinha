require('dotenv').config(); // Loads environment variables from .env

const express = require('express');
const path = require('path');
const sql = require('mssql'); // Imports the mssql module for SQL Server connection
const { getPool } = require('./db'); // Imports the getPool function from db.js (in the same folder)

const app = express();
const port = process.env.PORT || 3000; // Defines the port, using .env or 3000 as default

// --- Middleware and Route Configuration ---

// Defines the path to the 'public' folder (where static files like index.html, script.js, style.css are located)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath)); // Middleware to serve static files
console.log(`Serving static files from: ${publicPath}`);

// Middleware to parse JSON request bodies
app.use(express.json());

// --- API Route for ZIP Code Search ---
app.get('/api/search', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';

    console.log(`[DEBUG - API Search] Requisição recebida. Termo: "${query}"`);

    if (!query) {
        console.warn('[WARN - API Search] Requisição de busca sem termo.');
        return res.status(400).json({ error: 'Um termo de busca (rua, bairro) é obrigatório.' });
    }

    let pool;
    try {
        pool = await getPool();
        console.log('[DEBUG - API Search] Pool de conexão com o banco de dados obtido.');

        const request = pool.request();

        console.log(`[DEBUG - API Search] Configurando input para a query: searchQuery="${query}"`);

        // --- SQL QUERY: ADJUSTED TO SEARCH ONLY BY STREET/NEIGHBORHOOD ---
        const sqlQuery = `
            SELECT TOP 20
                c.num_cep AS cep,
                c.nome_bairro AS bairro,
                c.nome_rua AS rua,
                n.inicio_intervalo AS lote_inicial,
                n.fim_intervalo AS lote_final
            FROM dbo.Cep c
            INNER JOIN dbo.Numero n ON c.num_cep = n.num_cep
            WHERE
                c.nome_bairro COLLATE Latin1_General_CI_AI LIKE '%' + @searchQuery + '%' OR
                c.nome_rua COLLATE Latin1_General_CI_AI LIKE '%' + @searchQuery + '%';
        `;

        request.input('searchQuery', sql.NVarChar, query);

        console.log(`\n[DEBUG - SQL Query START]\n${sqlQuery}\n[DEBUG - SQL Query END]\n`);
        console.log(`[DEBUG - API Search] Executando query SQL com termo: "${query}"`);

        const result = await request.query(sqlQuery);
        console.log(`[DEBUG - API Search] Query SQL executada. Resultados encontrados: ${result.recordset.length}`);

        if (result.recordset.length > 0) {
            console.log('[DEBUG - API Search] Enviando resultados como JSON.');
            res.json(result.recordset);
        } else {
            console.log('[DEBUG - API Search] Nenhum resultado encontrado.');
            res.json({ message: 'Nenhum resultado encontrado para a sua busca.', results: [] });
        }
    } catch (err) {
        console.error('\n--- ERRO CRÍTICO NA ROTA /api/search ---');
        console.error('Detalhes do erro:', err.message);
        console.error('Código/Número do erro (se houver):', err.code || err.number);
        console.error('Estado do erro (se houver):', err.state);
        console.error('Parâmetros da requisição:', { query });
        console.error('Stack Trace completa:', err.stack);
        res.status(500).json({ error: 'Ocorreu um erro interno ao buscar os dados. Verifique o log do servidor para mais detalhes.' });
    }
});

// --- Catch-all route to serve index.html (for SPAs) ---
app.get('*', (req, res) => {
    console.log(`[DEBUG - Catch-all] Requisição para ${req.originalUrl} caindo na rota catch-all (servindo index.html).`);
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Internal server error when loading the page.');
        }
    });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Node.js server running on port ${port}`);
    console.log(`Access the application at: http://localhost:${port}`);

    getPool()
        .then(() => {
            console.log('Initial check: Database connection OK.');
        })
        .catch(err => {
            console.error('Initial check: ERROR connecting to the database on startup!', err.message);
            console.error('Please check your .env credentials and SQL Server accessibility.');
        });
});