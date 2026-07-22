import dotenv from 'dotenv';

dotenv.config();

let oracledb;

try {
  oracledb = await import('oracledb');
  oracledb.default.outFormat = oracledb.default.OUT_FORMAT_OBJECT;
} catch (error) {
  console.warn('Oracle DB driver is unavailable. Wardrobe persistence will use the local fallback store.');
}

function cleanEnvValue(val) {
  if (typeof val !== 'string') return val;
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1);
  }
  return clean.trim();
}

function getConfig() {
  const user = process.env.ORACLE_USER || process.env.DB_USER || process.env.DB_USERNAME;
  const password = process.env.ORACLE_PASSWORD || process.env.DB_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING || process.env.DB_CONNECT_STRING || `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 1521}/${process.env.DB_NAME || 'xe'}`;

  return {
    user: cleanEnvValue(user),
    password: cleanEnvValue(password),
    connectString: cleanEnvValue(connectString),
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
    poolTimeout: 60,
  };
}

export async function createConnection() {
  const config = getConfig();

  if (!oracledb || !config.user || !config.password || !config.connectString) {
    throw new Error('Oracle connection is not configured');
  }

  return oracledb.default.getConnection(config);
}

export async function createPool() {
  const config = getConfig();

  if (!oracledb || !config.user || !config.password || !config.connectString) {
    return null;
  }

  return oracledb.default.createPool(config);
}

export async function closePool() {
  if (!oracledb) {
    return;
  }

  const pool = oracledb.default.getPool();
  if (pool) {
    await pool.close(0);
  }
}
