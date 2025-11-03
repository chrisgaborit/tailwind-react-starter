const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

exports.pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
