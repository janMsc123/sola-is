// db.js — povezava s podatkovno bazo (MariaDB)
// To datoteko uporabijo vse poti (routes), da lahko berejo in pišejo v bazo.

// knjižnica za MySQL/MariaDB; "promise" pomeni, da lahko uporabljamo await
const mysql = require('mysql2/promise');

// pool = zaloga povezav; vsaka zahteva si izposodi eno in jo potem vrne
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // ime vsebnika z bazo (v docker-compose je to "baza")
  user: process.env.DB_USER,         // uporabnik baze (iz .env)
  password: process.env.DB_PASSWORD, // geslo baze (iz .env)
  database: process.env.DB_NAME,     // ime baze (iz .env)
  connectionLimit: 10                // največ 10 povezav hkrati
});

// izvozimo pool, da ga druge datoteke dobijo z: const db = require('./db');
module.exports = pool;
