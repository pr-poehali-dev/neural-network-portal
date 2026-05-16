-- Добавляем колонку is_credit_pack для разовых пакетов изображений
ALTER TABLE t_p97689468_neural_network_porta.subscription_plans
  ADD COLUMN IF NOT EXISTS is_credit_pack BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS credit_images INTEGER NULL;

-- Вставляем тарифы-пакеты (разовые покупки изображений)
INSERT INTO t_p97689468_neural_network_porta.subscription_plans
  (name, slug, price, generations_per_tool, is_unlimited, duration_months, description, is_single_tool, is_active, is_credit_pack, credit_images)
VALUES
  ('1 изображение',   'img_pack_1',   20,    NULL, false, 0, 'Разовая генерация или редактирование',    false, true, true, 1),
  ('10 изображений',  'img_pack_10',  200,   NULL, false, 0, '10 генераций или редактирований фото',    false, true, true, 10),
  ('50 изображений',  'img_pack_50',  1000,  NULL, false, 0, '50 генераций или редактирований фото',    false, true, true, 50),
  ('100 изображений', 'img_pack_100', 2000,  NULL, false, 0, '100 генераций или редактирований фото',   false, true, true, 100);
