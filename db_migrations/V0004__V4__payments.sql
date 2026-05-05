CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  yookassa_payment_id VARCHAR(64) UNIQUE,
  amount INTEGER NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  single_tool_slug VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
