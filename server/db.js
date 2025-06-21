const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool;

async function getPool() {
    if (!pool || pool.connected === false) {
        try {
            console.log('Tentando conectar ao banco de dados com a configuração:', {
                user: process.env.DB_USER,
                password: '[HIDDEN]',
                server: process.env.DB_SERVER,
                database: process.env.DB_DATABASE,
                port: parseInt(process.env.DB_PORT) || 1433
            });
            pool = await sql.connect(config);
            console.log('Conexão com o banco de dados estabelecida.');
            const result = await pool.request().query('SELECT 1 AS test');
            console.log('Teste de conexão bem-sucedido:', result.recordset);
        } catch (err) {
            console.error('Erro ao conectar ao banco de dados:', {
                message: err.message,
                code: err.code,
                number: err.number,
                state: err.state
            });
            throw err;
        }
    }
    return pool;
}

getPool().catch(err => {
    console.error('Erro inicial na conexão com o banco:', {
        message: err.message,
        code: err.code,
        number: err.number,
        state: err.state
    });
});

module.exports = { getPool };