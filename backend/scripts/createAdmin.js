const db = require('../db');
const bcrypt = require('bcryptjs');

const fullName = 'BuildTrack Admin';
const email = 'admin@buildtrack.com';
const password = 'Admin@12345';

const existingUser = db
  .prepare('SELECT id FROM users WHERE email = ?')
  .get(email);

if (existingUser) {
  console.log('Admin user already exists.');
  process.exit(0);
}

const hashedPassword = bcrypt.hashSync(password, 10);

const result = db
  .prepare(`
    INSERT INTO users (full_name, email, password, role)
    VALUES (?, ?, ?, ?)
  `)
  .run(fullName, email, hashedPassword, 'admin');

console.log('Admin created successfully.');
console.log('ID:', result.lastInsertRowid);
console.log('Email:', email);