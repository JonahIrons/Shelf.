# Database Setup and Authentication Guide

## Database Location

Your database is configured to use **MySQL** and the connection is set up in:
- **Config File**: `config/db.js`
- **Connection Pool**: Uses `mysql2` package with connection pooling
- **Environment Variables**: Set in `.env` file (see `env.example`)

The database is already initialized when the server starts via `server.js`, which calls `createAllTable()` to ensure all tables exist.

## Authentication & Session Management

### How It Works

1. **JWT Tokens**: When users login or signup, they receive a JWT token
2. **Token Storage**: Frontend should store this token (typically in localStorage)
3. **Token Usage**: Send token in `Authorization` header as `Bearer <token>`
4. **Middleware**: The `authenticate` middleware verifies tokens and adds `req.user` to protected routes

### API Endpoints

#### Authentication Routes (`/api/auth`)

- `POST /api/auth/register-user` - Register new user
  - Body: `{ username, email, password }`
  - Returns: `{ success, token, user }`

- `POST /api/auth/log-user` - Login user
  - Body: `{ username, password }`
  - Returns: `{ success, token, user }`

- `GET /api/auth/verify` - Verify token (protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success, user }`

### Using Authentication in Frontend

```javascript
// Store token after login/signup
localStorage.setItem('token', response.data.token);

// Send token with requests
fetch('/api/bookshelves', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Check if user is logged in
fetch('/api/auth/verify', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## Database Schema

### Tables

1. **users** - User accounts
   - `id`, `username`, `email`, `password_hash`, `created_at`

2. **books** - Book information (cached from OpenLibrary)
   - `id`, `openlibrary_id`, `isbn`, `title`, `author`, `published_year`, `cover_url`, `description`, `created_at`
   - Indexes on: `author`, `title`, `published_year`, `isbn`

3. **bookshelves** - User's bookshelf collections (Main table for Requirement 1)
   - `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`
   - Foreign key to `users`
   - Index on: `user_id`

4. **bookshelf_books** - Many-to-many: Books in Bookshelves
   - `bookshelf_id`, `book_id`, `added_at`
   - Primary key: `(bookshelf_id, book_id)`
   - Foreign keys to `bookshelves` and `books`

5. **reviews** - User reviews of books
   - `id`, `user_id`, `book_id`, `rating` (1-10), `review_text`, `created_at`
   - Foreign keys to `users` and `books`
   - Unique constraint: one review per user per book
   - Indexes on: `user_id`, `book_id`, `rating`

## Requirement 1: Bookshelf CRUD Interface

### Endpoints (`/api/bookshelves`)

All routes require authentication.

#### Get All Bookshelves
- `GET /api/bookshelves`
- Returns all bookshelves for the authenticated user

#### Get Single Bookshelf (with books)
- `GET /api/bookshelves/:id`
- Returns bookshelf details and all books in it

#### Create Bookshelf
- `POST /api/bookshelves`
- Body: `{ name, description? }`
- Creates a new bookshelf for the user

#### Update Bookshelf
- `PUT /api/bookshelves/:id`
- Body: `{ name?, description? }`
- Updates bookshelf name and/or description

#### Delete Bookshelf
- `DELETE /api/bookshelves/:id`
- Deletes bookshelf (cascade deletes all book associations)

#### Add Book to Bookshelf
- `POST /api/bookshelves/:id/books`
- Body: `{ book_id }`
- Adds a book to the bookshelf

#### Remove Book from Bookshelf
- `DELETE /api/bookshelves/:id/books/:book_id`
- Removes a book from the bookshelf

### How This Satisfies Requirement 1

- **Main Table**: `bookshelves` - users can create, edit, delete bookshelves
- **Supporting Table Operations**: `bookshelf_books` - automatically managed when adding/removing books from bookshelves
- **Full CRUD**: Create (POST), Read (GET), Update (PUT), Delete (DELETE) operations

## Requirement 2: Report Interface with Filtering

### Endpoint (`/api/reports`)

#### Generate Book Report
- `GET /api/reports/books`
- Requires authentication

### Query Parameters (Filters)

- `bookshelf_id` - Filter by specific bookshelf
- `author` - Filter by author name (partial match)
- `year_from` - Minimum published year
- `year_to` - Maximum published year
- `rating_min` - Minimum average rating (1-10)
- `rating_max` - Maximum average rating (1-10)
- `limit` - Results per page (default: 100)
- `offset` - Pagination offset (default: 0)

### Example Usage

```
GET /api/reports/books?bookshelf_id=1&author=Orwell&year_from=1940&year_to=1950&rating_min=7
```

### Response Structure

```json
{
  "success": true,
  "filters": {
    "bookshelf_id": "1",
    "author": "Orwell",
    "year_from": "1940",
    "year_to": "1950",
    "rating_min": "7",
    "rating_max": null
  },
  "data": {
    "books": [
      {
        "id": 1,
        "title": "1984",
        "author": "George Orwell",
        "published_year": 1949,
        "avg_rating": "8.50",
        "review_count": 2,
        "bookshelf_count": 1,
        "bookshelf_names": ["Favorites"]
      }
    ],
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 1
    }
  },
  "statistics": {
    "total_books": 1,
    "total_bookshelves": 3,
    "avg_books_per_bookshelf": "5.33",
    "overall_avg_rating": "7.85",
    "total_books_with_reviews": 8,
    "unique_authors": 5,
    "year_range": {
      "earliest": 1949,
      "latest": 2020
    }
  },
  "filter_options": {
    "bookshelves": [
      {"id": 1, "name": "Favorites"},
      {"id": 2, "name": "To Read"}
    ],
    "authors": ["George Orwell", "F. Scott Fitzgerald", ...],
    "year_range": {
      "min": 1949,
      "max": 2020
    }
  }
}
```

### How This Satisfies Requirement 2

- **User-selectable filters**: Bookshelf, author, year range, rating range
- **Dynamic filter options**: API returns available bookshelves and authors for dropdowns
- **Report generation**: Returns filtered books with relevant data
- **Statistics**: 
  - Average rating
  - Total books count
  - Average books per bookshelf
  - Total books with reviews
  - Unique authors count
  - Year range (earliest/latest)

## Next Steps for Frontend Implementation

1. **Store JWT Token**: After login/signup, save token to localStorage
2. **Add Auth Header**: Include token in all protected API calls
3. **Bookshelf Management Page**: Create UI for CRUD operations on bookshelves
4. **Report Page**: Create UI with filter dropdowns and statistics display
5. **Book Storage**: When books are searched/added, store them in database so they can be added to bookshelves

## Environment Variables

Make sure your `.env` file has:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookshelf
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
PORT=3001
```

## Testing the Setup

1. Start the server: `npm run dev` (or `npm start`)
2. Register a user: `POST /api/auth/register-user`
3. Login: `POST /api/auth/log-user` (save the token)
4. Create a bookshelf: `POST /api/bookshelves` with token
5. Generate a report: `GET /api/reports/books` with token

