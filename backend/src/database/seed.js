const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  try {
    console.log('Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING 
       RETURNING id`,
      ['Admin User', 'admin@example.com', hashedPassword, 'admin']
    );

    // Create demo customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    await db.query(
      `INSERT INTO users (name, email, password, role, address, city, postal_code, country) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (email) DO NOTHING`,
      ['John Doe', 'john@example.com', customerPassword, 'customer', '123 Main St', 'New York', '10001', 'USA']
    );

    // Create categories
    const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'];
    for (const cat of categories) {
      await db.query(
        `INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [cat, `${cat} products and accessories`]
      );
    }

    // Fetch category IDs
    const catResult = await db.query('SELECT id, name FROM categories ORDER BY id');
    const catMap = {};
    catResult.rows.forEach((row) => (catMap[row.name] = row.id));

    // Create sample products
    const products = [
      { name: 'Wireless Bluetooth Headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life.', price: 79.99, stock: 50, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', featured: true },
      { name: 'Smartphone Pro Max', description: '6.7-inch OLED display, 128GB storage, 48MP camera system.', price: 999.99, stock: 30, category: 'Electronics', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', featured: true },
      { name: 'Laptop Ultra Slim', description: '14-inch laptop with M-series chip, 16GB RAM, 512GB SSD.', price: 1299.99, stock: 20, category: 'Electronics', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', featured: true },
      { name: 'Smart Watch Series 5', description: 'Health and fitness tracking, GPS, heart rate monitor.', price: 349.99, stock: 40, category: 'Electronics', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', featured: false },
      { name: 'Wireless Charging Pad', description: 'Fast wireless charger compatible with all Qi-enabled devices.', price: 29.99, stock: 100, category: 'Electronics', image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500', featured: false },
      { name: 'Classic Denim Jacket', description: 'Timeless denim jacket made from premium cotton.', price: 89.99, stock: 60, category: 'Clothing', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', featured: true },
      { name: 'Running Shoes Pro', description: 'Lightweight performance running shoes with responsive cushioning.', price: 129.99, stock: 45, category: 'Clothing', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', featured: false },
      { name: 'Cotton T-Shirt Pack (3)', description: 'Set of 3 premium cotton t-shirts in black, white, and grey.', price: 39.99, stock: 80, category: 'Clothing', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', featured: false },
      { name: 'JavaScript: The Good Parts', description: 'A deep dive into the beautiful features of JavaScript.', price: 24.99, stock: 100, category: 'Books', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', featured: false },
      { name: 'Clean Code', description: 'A handbook of agile software craftsmanship by Robert C. Martin.', price: 34.99, stock: 75, category: 'Books', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500', featured: true },
      { name: 'Indoor Plant Set', description: 'Set of 3 low-maintenance indoor plants with decorative pots.', price: 49.99, stock: 35, category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500', featured: false },
      { name: 'LED Desk Lamp', description: 'Adjustable LED desk lamp with 5 brightness levels.', price: 44.99, stock: 55, category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500', featured: false },
      { name: 'Yoga Mat Premium', description: 'Non-slip exercise yoga mat with alignment lines. 6mm thick.', price: 34.99, stock: 70, category: 'Sports', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', featured: false },
      { name: 'Resistance Bands Set', description: 'Set of 5 resistance bands with different tension levels.', price: 19.99, stock: 90, category: 'Sports', image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500', featured: false },
    ];

    for (const p of products) {
      await db.query(
        `INSERT INTO products (name, description, price, stock, category_id, image_url, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [p.name, p.description, p.price, p.stock, catMap[p.category], p.image, p.featured]
      );
    }

    console.log('Database seeded successfully!');
    console.log('Admin login: admin@example.com / admin123');
    console.log('Customer login: john@example.com / customer123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

seed();
