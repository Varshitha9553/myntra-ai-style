import { createConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

function normalizeWishlist(row) {
  return {
    id: row.WISHLIST_ID ?? row.wishlist_id,
    userId: row.USER_ID ?? row.user_id,
    productName: row.PRODUCT_NAME ?? row.product_name,
    productImage: row.PRODUCT_IMAGE ?? row.product_image,
    brand: row.BRAND ?? row.brand,
    price: row.PRICE ?? row.price,
    myntraUrl: row.MYNTRA_URL ?? row.myntra_url,
    createdAt: row.CREATED_AT ?? row.created_at,
  };
}

class WishlistService {
  async list(userId) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `SELECT wishlist_id, user_id, product_name, product_image, brand, price, myntra_url, created_at
         FROM wishlist WHERE user_id = :userId ORDER BY created_at DESC`,
        { userId }
      );
      return result.rows.map(normalizeWishlist);
    } finally {
      await connection.close();
    }
  }

  async create(userId, { productName, productImage, brand, price, myntraUrl }) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `INSERT INTO wishlist (user_id, product_name, product_image, brand, price, myntra_url)
         VALUES (:userId, :productName, :productImage, :brand, :price, :myntraUrl)
         RETURNING wishlist_id INTO :id`,
        {
          userId,
          productName,
          productImage: productImage || null,
          brand: brand || null,
          price: price ? Number(price) : null,
          myntraUrl: myntraUrl || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        }
      );
      await connection.commit();
      const outId = result.outBinds?.id || result.outBinds?.ID || result.outBinds?.wishlist_id || result.outBinds?.WISHLIST_ID;
      const idVal = Array.isArray(outId) ? outId[0] : outId;
      return { id: idVal || Date.now() };
    } finally {
      await connection.close();
    }
  }

  async delete(userId, wishlistId) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `DELETE FROM wishlist WHERE wishlist_id = :wishlistId AND user_id = :userId`,
        { wishlistId: Number(wishlistId), userId }
      );
      await connection.commit();
      return { success: result.rowsAffected > 0 };
    } finally {
      await connection.close();
    }
  }
}

export default new WishlistService();
