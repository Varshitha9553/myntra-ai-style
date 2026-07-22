import { createConnection } from '../config/oracle.js';

export async function getPreferences(req, res, next) {
  try {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        'SELECT preference_id, user_id, style, colors, budget, weather FROM user_preferences WHERE user_id = :userId',
        { userId: req.user.sub }
      );
      res.json(result.rows[0] || { style: 'smart casual', colors: 'black,white,blue', budget: 5000, weather: 'all' });
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(req, res, next) {
  try {
    const connection = await createConnection();
    try {
      await connection.execute(
        `MERGE INTO user_preferences p
         USING (SELECT :userId AS user_id FROM dual) src
         ON (p.user_id = src.user_id)
         WHEN MATCHED THEN
           UPDATE SET style = :style, colors = :colors, budget = :budget, weather = :weather
         WHEN NOT MATCHED THEN
           INSERT (user_id, style, colors, budget, weather) VALUES (:userId, :style, :colors, :budget, :weather)`,
        {
          userId: req.user.sub,
          style: req.body.style || 'smart casual',
          colors: req.body.colors?.join(',') || 'black,white,blue',
          budget: req.body.budget || 5000,
          weather: req.body.weather || 'all',
        }
      );
      await connection.commit();
      res.json(req.body);
    } finally {
      await connection.close();
    }
  } catch (error) {
    next(error);
  }
}
