CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  referral_code VARCHAR(32) UNIQUE NOT NULL,
  referred_by INTEGER,
  is_admin BOOLEAN DEFAULT FALSE,
  free_image_generations INTEGER DEFAULT 1,
  free_carousel_generations INTEGER DEFAULT 1,
  bonus_generations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
