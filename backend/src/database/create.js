const { Pool } = require('pg');
const config = require('../config');

// Connect to default postgres database to create ecommerce database  
const tempPool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: 'postgres', // Connect to default postgres database
  user: config.db.user,
  password: config.db.password,
});

async function createDatabase() {
  try {
    console.log('Creating ecommerce database...');
    await tempPool.query('CREATE DATABASE ecommerce;');
    console.log('Database "ecommerce" created successfully!');
    await tempPool.end();
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Database "ecommerce" already exists!');
      await tempPool.end();
      process.exit(0);
    } else {
      console.error('Error creating database:', error.message);
      await tempPool.end();
      process.exit(1);
    }
  }
}

createDatabase();