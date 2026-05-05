UPDATE t_p97689468_neural_network_porta.users 
SET 
  password_hash = encode(sha256(('neuralai_salt_2024dupinadiana')::bytea), 'hex') || '|token:diana_login_token_xyz789abc123',
  is_admin = true
WHERE email = 'ddupina@inbox.ru';