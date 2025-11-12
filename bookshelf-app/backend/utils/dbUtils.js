import { pool } from '../config/db.js';

//Will store a cached copy of the book so I don't query the API every time
const booksTableQuery = `CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                openlibrary_id VARCHAR(50) UNIQUE,
                isbn VARCHAR(20),
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                published_year INT,
                cover_url VARCHAR(500),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_author (author),
                INDEX idx_title (title),
                INDEX idx_published_year (published_year),
                INDEX idx_isbn (isbn)
            );`

//Table representing bookshelves of each user (Can have multiple)
const bookshelvesTableQuery = `CREATE TABLE IF NOT EXISTS bookshelves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
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
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_book_id (book_id),
                INDEX idx_rating (rating),
                UNIQUE KEY unique_user_book_review (user_id, book_id)
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

// Migration function to add missing columns to existing tables
const migrateBooksTable = async () => {
    try {
        // Check and add isbn column if it doesn't exist
        try {
            await pool.query(`
                ALTER TABLE books 
                ADD COLUMN IF NOT EXISTS isbn VARCHAR(20)
            `);
            console.log('Books table: isbn column verified');
        } catch (error) {
            // MySQL doesn't support IF NOT EXISTS for columns, so this is a workaround.
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'books' 
                AND COLUMN_NAME = 'isbn'
            `);
            if (columns.length === 0) {
                await pool.query(`ALTER TABLE books ADD COLUMN isbn VARCHAR(20)`);
                console.log('Books table: Added isbn column');
            }
        }

        // Check and add published_year column if it doesn't exist
        try {
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'books' 
                AND COLUMN_NAME = 'published_year'
            `);
            if (columns.length === 0) {
                await pool.query(`ALTER TABLE books ADD COLUMN published_year INT`);
                console.log('Books table: Added published_year column');
            }
        } catch (error) {
            console.log('Error checking published_year column:', error);
        }

        // Check and add indexes if they don't exist
        try {
            const [indexes] = await pool.query(`
                SELECT INDEX_NAME 
                FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'books' 
                AND INDEX_NAME = 'idx_isbn'
            `);
            if (indexes.length === 0 && await columnExists('books', 'isbn')) {
                await pool.query(`CREATE INDEX idx_isbn ON books(isbn)`);
                console.log('Books table: Added idx_isbn index');
            }
        } catch (error) {
            // Index might already exist, ignore
        }

        try {
            const [indexes] = await pool.query(`
                SELECT INDEX_NAME 
                FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'books' 
                AND INDEX_NAME = 'idx_published_year'
            `);
            if (indexes.length === 0 && await columnExists('books', 'published_year')) {
                await pool.query(`CREATE INDEX idx_published_year ON books(published_year)`);
                console.log('Books table: Added idx_published_year index');
            }
        } catch (error) {
            // Index might already exist, ignore
        }

        // Check and add updated_at to bookshelves if needed
        try {
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'bookshelves' 
                AND COLUMN_NAME = 'updated_at'
            `);
            if (columns.length === 0) {
                await pool.query(`ALTER TABLE bookshelves ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
                console.log('Bookshelves table: Added updated_at column');
            }
        } catch (error) {
            console.log('Error checking updated_at column:', error);
        }

    } catch (error) {
        console.log('Migration error (this is okay if columns already exist):', error.message);
    }
};

// Helper function to check if a column exists
const columnExists = async (tableName, columnName) => {
    try {
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ? 
            AND COLUMN_NAME = ?
        `, [tableName, columnName]);
        return columns.length > 0;
    } catch (error) {
        return false;
    }
};

const createAllTable = async() => {
    try {
        await createTable('Users', userTableQuery);
        await createTable('Books', booksTableQuery);
        await createTable('Bookshelves', bookshelvesTableQuery);
        await createTable('Bookshelf_Books', bookshelf_booksTableQuery);
        await createTable('Reviews', reviewsTableQuery);

        // Run migrations to add any missing columns to existing tables
        await migrateBooksTable();

        console.log("All tables created successfully!");
    }
    catch (error) {
        console.log("Error creating tables", error);
        throw error;
    }
}

export { createTable, createAllTable };