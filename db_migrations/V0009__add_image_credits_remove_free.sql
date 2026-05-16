-- Добавляем поле image_credits (купленные изображения)
ALTER TABLE t_p97689468_neural_network_porta.users
  ADD COLUMN IF NOT EXISTS image_credits INTEGER NOT NULL DEFAULT 0;

-- Обнуляем бесплатные попытки для всех
UPDATE t_p97689468_neural_network_porta.users
  SET free_image_generations = 0,
      free_carousel_generations = 0;

-- Меняем DEFAULT для новых регистраций тоже в 0
ALTER TABLE t_p97689468_neural_network_porta.users
  ALTER COLUMN free_image_generations SET DEFAULT 0,
  ALTER COLUMN free_carousel_generations SET DEFAULT 0;
