import dotenv from 'dotenv';
import { createConnection } from './oracle.js';

// Database connection startup config
dotenv.config();

export default async function connectDB() {
  const connection = await createConnection();

  try {
    console.log('[DB Migrations] Running checks for missing tables...');
    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE users (
          user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          name VARCHAR2(200) NOT NULL,
          email VARCHAR2(200) UNIQUE NOT NULL,
          password_hash VARCHAR2(200) NOT NULL,
          avatar_url VARCHAR2(1000),
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE wardrobe_items (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER,
          name VARCHAR2(500),
          image_url VARCHAR2(1000),
          category VARCHAR2(200),
          color VARCHAR2(200),
          occasion VARCHAR2(200),
          season VARCHAR2(200),
          brand VARCHAR2(200),
          pattern VARCHAR2(200),
          ai_tags VARCHAR2(2000),
          notes CLOB,
          favorite NUMBER(1) DEFAULT 0 CHECK (favorite IN (0,1)),
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE q'[ALTER TABLE wardrobe_items ADD (pattern VARCHAR2(200))]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -1430 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE generated_outfits (
          outfit_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER,
          name VARCHAR2(200) NOT NULL,
          occasion VARCHAR2(100),
          weather VARCHAR2(100),
          score NUMBER(3),
          summary VARCHAR2(1000),
          items CLOB,
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE q'[ALTER TABLE generated_outfits ADD (items CLOB)]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -1430 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE recommendations (
          recommendation_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER,
          name VARCHAR2(500),
          category VARCHAR2(200),
          price NUMBER,
          mrp NUMBER,
          image_url VARCHAR2(1000),
          reason VARCHAR2(1000),
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE wear_history (
          history_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER,
          outfit_id NUMBER,
          item_ids VARCHAR2(500),
          occasion VARCHAR2(100),
          weather VARCHAR2(100),
          worn_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE wishlist (
          wishlist_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          product_name VARCHAR2(500) NOT NULL,
          product_image VARCHAR2(1000),
          brand VARCHAR2(200),
          price NUMBER,
          myntra_url VARCHAR2(1000),
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE q'[ALTER TABLE wardrobe_items ADD (ai_tags VARCHAR2(2000))]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -1430 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE q'[ALTER TABLE wardrobe_items ADD (favorite NUMBER(1) DEFAULT 0 CHECK (favorite IN (0,1)))]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -1430 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE q'[ALTER TABLE wardrobe_items ADD (last_worn TIMESTAMP)]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -1430 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      DECLARE
        cnt NUMBER;
      BEGIN
        -- Update Topwear
        UPDATE wardrobe_items SET category = 'Topwear' WHERE LOWER(category) IN ('top', 'shirt', 'blouse', 't-shirt');
        
        -- Update Bottomwear
        UPDATE wardrobe_items SET category = 'Bottomwear' WHERE LOWER(category) IN ('bottom', 'pant', 'jeans', 'shorts', 'skirt', 'trousers');
        
        -- Update Outerwear
        UPDATE wardrobe_items SET category = 'Outerwear' WHERE LOWER(category) IN ('outerwear', 'jacket', 'coat', 'sweater', 'hoodie');
        
        -- Update Dress
        UPDATE wardrobe_items SET category = 'Dress' WHERE LOWER(category) IN ('dress', 'gown', 'frock');
        
        -- Update Footwear
        UPDATE wardrobe_items SET category = 'Footwear' WHERE LOWER(category) IN ('shoes', 'shoe', 'sneaker', 'sneakers', 'sandal', 'boot', 'heel');
        
        -- Update Accessories
        UPDATE wardrobe_items SET category = 'Accessories' WHERE LOWER(category) IN ('accessory', 'belt', 'scarf', 'watch', 'bag', 'hat');

        -- Guess category from filename/name for items that got saved as generic Top or Topwear previously
        UPDATE wardrobe_items SET category = 'Bottomwear' WHERE (category = 'Top' OR category = 'Topwear') AND (LOWER(name) LIKE '%pant%' OR LOWER(name) LIKE '%jean%' OR LOWER(name) LIKE '%trouser%' OR LOWER(name) LIKE '%skirt%' OR LOWER(name) LIKE '%shorts%' OR LOWER(name) LIKE '%213054%');
        UPDATE wardrobe_items SET category = 'Outerwear' WHERE (category = 'Top' OR category = 'Topwear') AND (LOWER(name) LIKE '%jacket%' OR LOWER(name) LIKE '%coat%' OR LOWER(name) LIKE '%sweater%' OR LOWER(name) LIKE '%hoodie%' OR LOWER(name) LIKE '%cardigan%' OR LOWER(name) LIKE '%213626%');
        UPDATE wardrobe_items SET category = 'Footwear' WHERE (category = 'Top' OR category = 'Topwear') AND (LOWER(name) LIKE '%shoe%' OR LOWER(name) LIKE '%sneaker%' OR LOWER(name) LIKE '%sandal%' OR LOWER(name) LIKE '%boot%' OR LOWER(name) LIKE '%heel%' OR LOWER(name) LIKE '%200555%');
        UPDATE wardrobe_items SET category = 'Accessories' WHERE (category = 'Top' OR category = 'Topwear') AND (LOWER(name) LIKE '%belt%' OR LOWER(name) LIKE '%bag%' OR LOWER(name) LIKE '%watch%' OR LOWER(name) LIKE '%hat%' OR LOWER(name) LIKE '%scarf%' OR LOWER(name) LIKE '%cap%' OR LOWER(name) LIKE '%213657%' OR LOWER(name) LIKE '%200337%' OR LOWER(name) LIKE '%185338%');

        -- Set descriptive names for the specific test images
        UPDATE wardrobe_items SET name = 'Blue Denim Jeans' WHERE name LIKE '%213054%';
        UPDATE wardrobe_items SET name = 'Analog Black Watch' WHERE name LIKE '%213657%';
        UPDATE wardrobe_items SET name = 'White Hooded Jacket' WHERE name LIKE '%213626%';
        UPDATE wardrobe_items SET name = 'Black Crew Neck T-Shirt' WHERE name LIKE '%213635%';
        UPDATE wardrobe_items SET name = 'Black Sneakers' WHERE name LIKE '%200555%';
      END;
    `);

    await connection.execute(`
      BEGIN
      EXECUTE IMMEDIATE q'[
        CREATE TABLE wishlist (
          wishlist_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          product_name VARCHAR2(500) NOT NULL,
          product_image VARCHAR2(1000),
          brand VARCHAR2(200),
          price NUMBER,
          myntra_url VARCHAR2(1000),
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
        )
      ]';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE <> -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.commit();
    console.log('[DB Migrations] Migrations executed successfully.');

    console.log('Oracle connection ready');
    return true;
  } catch (error) {
    console.error('Oracle connection error:', error.message);
    throw error;
  } finally {
    await connection.close();
  }
}
