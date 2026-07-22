import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

class AuthService {
  async register({ name, email, password }) {
    const connection = await createConnection();
    try {
      const existing = await connection.execute('SELECT user_id FROM users WHERE email = :email', { email });
      if (existing.rows.length) {
        throw new Error('User already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await connection.execute(
        `INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :passwordHash) RETURNING user_id INTO :userId`,
        {
          name,
          email,
          passwordHash,
          userId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        }
      );

      await connection.commit();
      const userId = result.outBinds.userId[0];
      const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return { userId, token };
    } finally {
      await connection.close();
    }
  }

  async login({ email, password }) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        'SELECT user_id, name, email, password_hash FROM users WHERE email = :email',
        { email }
      );
      const user = result.rows[0];
      if (!user) throw new Error('Invalid credentials');

      const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);
      if (!isValid) throw new Error('Invalid credentials');

      const token = jwt.sign({ sub: user.USER_ID }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return { userId: user.USER_ID, name: user.NAME, email: user.EMAIL, token };
    } finally {
      await connection.close();
    }
  }

  async getProfile(userId) {
    const connection = await createConnection();
    try {
      const userResult = await connection.execute(
        'SELECT user_id, name, email, avatar_url, created_at FROM users WHERE user_id = :userId',
        { userId }
      );
      const user = userResult.rows[0];
      if (!user) return null;

      const wardrobeResult = await connection.execute(
        'SELECT COUNT(*) AS count FROM wardrobe_items WHERE user_id = :userId',
        { userId }
      );
      const wardrobeCount = wardrobeResult.rows[0]?.COUNT || wardrobeResult.rows[0]?.count || 0;

      const wishlistResult = await connection.execute(
        'SELECT COUNT(*) AS count FROM wishlist WHERE user_id = :userId',
        { userId }
      );
      const wishlistCount = wishlistResult.rows[0]?.COUNT || wishlistResult.rows[0]?.count || 0;

      return {
        userId: user.USER_ID ?? user.user_id,
        name: user.NAME ?? user.name,
        email: user.EMAIL ?? user.email,
        avatarUrl: user.AVATAR_URL ?? user.avatar_url,
        createdAt: user.CREATED_AT ?? user.created_at,
        wardrobeCount,
        wishlistCount,
      };
    } finally {
      await connection.close();
    }
  }

  async updateProfile(userId, { name, avatarUrl }) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `UPDATE users SET name = :name, avatar_url = :avatarUrl, updated_at = SYSTIMESTAMP
         WHERE user_id = :userId`,
        { name, avatarUrl: avatarUrl || null, userId }
      );
      await connection.commit();
      return { success: result.rowsAffected > 0 };
    } finally {
      await connection.close();
    }
  }
}

export default new AuthService();
