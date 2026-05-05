CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  generations_per_tool INTEGER,
  is_unlimited BOOLEAN DEFAULT FALSE,
  duration_months INTEGER DEFAULT 1,
  description TEXT,
  is_single_tool BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  granted_by_admin BOOLEAN DEFAULT FALSE,
  single_tool_slug VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tool_generations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tool_slug VARCHAR(50) NOT NULL,
  prompt TEXT,
  result_url TEXT,
  result_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER UNIQUE,
  bonus_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  author_id INTEGER,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_tools_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  pricing_type VARCHAR(50),
  logo_url TEXT,
  website_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  votes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  capabilities TEXT[]
);
