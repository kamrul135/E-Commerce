# ShopHub - E-Commerce Application

A full-stack e-commerce application built with React, Node.js, Express, and PostgreSQL.

## Features

- **User Authentication** - Register, login, JWT-based sessions, role-based access
- **Product Catalog** - Browse, search, filter, sort, pagination
- **Shopping Cart** - Add/remove items, update quantities, persistent cart
- **Order Management** - Place orders, view order history, track status
- **Admin Dashboard** - Manage products (CRUD), manage orders, update statuses
- **Responsive Design** - Mobile-friendly UI

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication (bcrypt)
- Express Validator

### Frontend
- React 18 + Vite
- React Router v6
- Axios (API client)
- Context API (state management)
- Lucide React (icons)
- React Hot Toast (notifications)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE ecommerce;
```

### 2. Backend Setup

```bash
cd backend
npm install

# Edit .env with your database credentials
# Then initialize and seed the database:
npm run db:init
npm run db:seed

# Start the server
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` with API proxy to the backend.

### 4. Demo Accounts

After seeding, use these accounts:

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Admin    | admin@example.com  | admin123    |
| Customer | john@example.com   | customer123 |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # App & database config
│   │   ├── controllers/     # Route handlers
│   │   ├── database/        # Init & seed scripts
│   │   ├── middleware/       # Auth & validation middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── server.js        # Express app entry point
│   ├── .env                 # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context providers
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── App.jsx          # Router & layout
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (auth)
- `PUT /api/auth/profile` - Update profile (auth)
- `PUT /api/auth/password` - Change password (auth)

### Products
- `GET /api/products` - List products (public)
- `GET /api/products/:id` - Get product (public)
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories (public)

### Cart
- `GET /api/cart` - Get cart (auth)
- `POST /api/cart` - Add item (auth)
- `PUT /api/cart/:productId` - Update quantity (auth)
- `DELETE /api/cart/:productId` - Remove item (auth)
- `DELETE /api/cart` - Clear cart (auth)

### Orders
- `POST /api/orders` - Create order (auth)
- `GET /api/orders` - List orders (auth)
- `GET /api/orders/:id` - Get order (auth)
- `PUT /api/orders/:id/status` - Update status (admin)
