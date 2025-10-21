const { pool } = require('../config/db');

//Will store a cached copy of the book so I don't query the API every time
const booksTableQuery = `CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                openlibrary_id VARCHAR(50) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                cover_url VARCHAR(500),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`

//Table representing bookshelves of each user (Can have multiple)
const bookshelvesTableQuery = `CREATE TABLE IF NOT EXISTS bookshelves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`

//Table representing many-to-many relationship between books and bookshelves
const bookshelf_booksTableQuery = `CREATE TABLE IF NOT EXISTS bookshelf_books (
                bookshelf_id INT NOT NULL,
                book_id INT NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (bookshelf_id, book_id),
                FOREIGN KEY (bookshelf_id) REFERENCES bookshelves(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
            );`

const reviewsTableQuery = `CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                book_id INT NOT NULL,
                rating TINYINT CHECK (rating BETWEEN 1 AND 10),
                review_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
            );`

const userTableQuery = `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`

const createTable = async(tableName, query) => {
    try {
        await pool.query(query)

        console.log(`${tableName} table created or already exists`);
    }
    catch (error) {
        console.log(`Error creating ${tableName}`, error);
    }
}

const createAllTable = async() => {
    try {
        await createTable('Users', userTableQuery);
        await createTable('Books', booksTableQuery);
        await createTable('Bookshelves', bookshelvesTableQuery);
        await createTable('Bookshelf_Books', bookshelf_booksTableQuery);
        await createTable('Reviews', reviewsTableQuery);

        console.log("All tables created successfully!");
    }
    catch (error) {
        console.log("Error creating tables", error);
        throw error;
    }
}

module.exports = { createTable, createAllTable };