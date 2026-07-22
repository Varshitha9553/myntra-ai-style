import { createConnection } from '../config/oracle.js';

const run = async () => {
  let connection;
  try {
    connection = await createConnection();
    const result = await connection.execute('SELECT id, name, category, color, image_url FROM wardrobe_items');
    console.log(result.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    if (connection) await connection.close();
  }
};
run();
