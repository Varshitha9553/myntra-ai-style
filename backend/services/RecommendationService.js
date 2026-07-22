import { createConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

function normalizeRecommendation(row) {
  return {
    recommendationId: row.RECOMMENDATION_ID ?? row.recommendation_id,
    userId: row.USER_ID ?? row.user_id,
    name: row.NAME ?? row.name,
    category: row.CATEGORY ?? row.category,
    price: row.PRICE ?? row.price,
    mrp: row.MRP ?? row.mrp,
    imageUrl: row.IMAGE_URL ?? row.image_url,
    reason: row.REASON ?? row.reason,
    createdAt: row.CREATED_AT ?? row.created_at,
    updatedAt: row.UPDATED_AT ?? row.updated_at,
  };
}

class RecommendationService {
  async list(userId) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `SELECT recommendation_id, user_id, name, category, price, mrp, image_url, reason, created_at, updated_at
         FROM recommendations WHERE user_id = :userId ORDER BY created_at DESC`,
        { userId }
      );
      return result.rows.map(normalizeRecommendation);
    } finally {
      await connection.close();
    }
  }

  async create(userId, recommendation) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `INSERT INTO recommendations (user_id, name, category, price, mrp, image_url, reason)
         VALUES (:userId, :name, :category, :price, :mrp, :imageUrl, :reason)
         RETURNING recommendation_id INTO :recommendationId`,
        {
          userId,
          name: recommendation.name,
          category: recommendation.category,
          price: recommendation.price,
          mrp: recommendation.mrp,
          imageUrl: recommendation.imageUrl,
          reason: recommendation.reason,
          recommendationId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        }
      );
      await connection.commit();
      return { recommendationId: result.outBinds.recommendationId[0] };
    } finally {
      await connection.close();
    }
  }
}

export default new RecommendationService();
