const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 4000;

// Configurar o parser de JSON
app.use(bodyParser.json({ limit: '50mb' })); // Aumenta o limite de tamanho do JSON para suportar imagens base64 grandes

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./db_digital_shield.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Criar tabela se não existir
        db.run(`CREATE TABLE IF NOT EXISTS company (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            message TEXT,
            image BLOB
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela company', err.message);
            }
        });
    }
});

// Rota para criar uma nova empresa
app.post('/company', (req, res) => {
    const { name, phone, message, image } = req.body;
    db.run(`INSERT INTO company (name, phone, message, image) VALUES (?, ?, ?, ?)`, [name, phone, message, Buffer.from(image, 'base64')], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao salvar a empresa no banco de dados', error: err.message });
        }
        res.status(201).json({ message: 'Empresa criada com sucesso', companyId: this.lastID });
    });
});

// Rota para obter todas as empresas
// app.get('/company', (req, res) => {
//     db.all(`SELECT id, name, phone, message, image FROM company`, (err, rows) => {
//         if (err) {
//             return res.status(500).json({ message: 'Erro ao buscar as empresas do banco de dados', error: err.message });
//         }
//         // Converter imagens BLOB de volta para base64 antes de enviar a resposta
//         const companies = rows.map(row => ({
//             id: row.id,
//             name: row.name,
//             phone: row.phone,
//             message: row.message,
//             image: row.image.toString('base64')
//         }));
//         res.json(companies);
//     });
// });

app.get('/company', (req, res) => {
    // Obter o parâmetro de consulta (query string) "name" da requisição
    const { name } = req.query;

    // Se o parâmetro "name" estiver presente, filtra as empresas com o nome correspondente
    if (name) {
        db.all(`SELECT id, name, phone, message, image FROM company WHERE name LIKE ?`, [`%${name}%`], (err, rows) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao buscar as empresas do banco de dados', error: err.message });
            }

            // Converter imagens BLOB de volta para base64 antes de enviar a resposta
            const companies = rows.map(row => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                message: row.message,
                image: row.image.toString('base64')
            }));
            res.json(companies);
        });
    } else {
        // Se o parâmetro "name" não for fornecido, retornar todas as empresas
        db.all(`SELECT id, name, phone, message, image FROM company`, (err, rows) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao buscar as empresas do banco de dados', error: err.message });
            }

            // Converter imagens BLOB de volta para base64 antes de enviar a resposta
            const companies = rows.map(row => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                message: row.message,
                image: row.image.toString('base64')
            }));
            res.json(companies);
        });
    }
});

// Rota para obter todas as empresas
app.get('/companylist', (req, res) => {
    db.all(`SELECT id, name FROM company_list`, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar as empresas do banco de dados', error: err.message });
        }
        // Converter imagens BLOB de volta para base64 antes de enviar a resposta
        var companies = rows.map(row => ({
            id: row.id,
            name: row.name
        }));

        companies.sort((a, b) => a.name.localeCompare(b.name));
        res.json(companies);
    });
});

app.get('/check-company', (req, res) => {
    const searchString = req.query.searchString; // Obter a string de busca dos parâmetros de consulta

    if (!searchString) {
        return res.status(400).json({ message: 'Parâmetro de busca "searchString" é necessário.' });
    }

    // Contar o número de ocorrências do nome na tabela 'company'
    db.get(`SELECT COUNT(*) AS count FROM company WHERE phone = ?`, [searchString], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao consultar o banco de dados', error: err.message });
        }

        // Retornar a contagem de ocorrências
        res.status(200).json({ count: row.count });
    });
});


// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
