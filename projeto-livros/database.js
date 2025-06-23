
const mysql = require('mysql2/promise');


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'jedi',
  database: 'biblioteca',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


async function createTable() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS obras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        autor VARCHAR(255) NOT NULL,
        descricao TEXT,
        genero VARCHAR(100),
        tipo ENUM('livro', 'mangá') NOT NULL,
        capa VARCHAR(255),
        data_publicacao DATE,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log('Tabela verificada/criada com sucesso');
  } catch (err) {
    console.error('Erro ao criar tabela:', err);
  }
}


createTable();

module.exports = pool;