CREATE TABLE users (
  user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  email VARCHAR2(255) NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  avatar_url VARCHAR2(500),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE TABLE user_preferences (
  preference_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  style VARCHAR2(100) DEFAULT 'smart casual',
  colors VARCHAR2(500) DEFAULT 'black,white,blue',
  budget NUMBER DEFAULT 5000,
  weather VARCHAR2(50) DEFAULT 'all',
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

CREATE TABLE wardrobe (
  wardrobe_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR2(200) NOT NULL,
  category VARCHAR2(100) NOT NULL,
  color VARCHAR2(100),
  pattern VARCHAR2(100),
  season VARCHAR2(100),
  occasion VARCHAR2(100),
  image_url VARCHAR2(500),
  favorite NUMBER(1) DEFAULT 0 CHECK (favorite IN (0,1)),
  ai_tags VARCHAR2(500),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_wardrobe_user ON wardrobe(user_id);

CREATE TABLE wardrobe_images (
  image_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wardrobe_id NUMBER NOT NULL REFERENCES wardrobe(wardrobe_id) ON DELETE CASCADE,
  file_name VARCHAR2(255) NOT NULL,
  stored_path VARCHAR2(500) NOT NULL,
  mime_type VARCHAR2(100),
  uploaded_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_wardrobe_images_wardrobe ON wardrobe_images(wardrobe_id);

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
);

CREATE INDEX idx_wardrobe_items_user ON wardrobe_items(user_id);

CREATE TABLE generated_outfits (
  outfit_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR2(200) NOT NULL,
  occasion VARCHAR2(100),
  weather VARCHAR2(100),
  score NUMBER(3),
  summary VARCHAR2(1000),
  items CLOB,
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE TABLE outfit_items (
  outfit_item_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  outfit_id NUMBER NOT NULL REFERENCES generated_outfits(outfit_id) ON DELETE CASCADE,
  wardrobe_id NUMBER NOT NULL REFERENCES wardrobe(wardrobe_id) ON DELETE CASCADE,
  role VARCHAR2(50) NOT NULL,
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_outfit_items_outfit ON outfit_items(outfit_id);
CREATE INDEX idx_outfit_items_wardrobe ON outfit_items(wardrobe_id);

CREATE TABLE recommendations (
  recommendation_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR2(200) NOT NULL,
  price NUMBER(10,2),
  mrp NUMBER(10,2),
  image_url VARCHAR2(500),
  reason VARCHAR2(1000),
  category VARCHAR2(100),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);

CREATE TABLE shopping_analysis (
  analysis_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_name VARCHAR2(200) NOT NULL,
  verdict VARCHAR2(100),
  compatibility NUMBER(3),
  wardrobe_match NUMBER(3),
  duplicates NUMBER(3),
  versatility_boost NUMBER(3),
  recommendation VARCHAR2(500),
  sustainability VARCHAR2(10),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_shopping_analysis_user ON shopping_analysis(user_id);

CREATE TABLE wishlist (
  wishlist_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  item_id VARCHAR2(100) NOT NULL,
  name VARCHAR2(200) NOT NULL,
  image_url VARCHAR2(500),
  price NUMBER(10,2),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);

CREATE TABLE purchase_history (
  purchase_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  item_name VARCHAR2(200) NOT NULL,
  price NUMBER(10,2),
  purchased_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX idx_purchase_history_user ON purchase_history(user_id);
