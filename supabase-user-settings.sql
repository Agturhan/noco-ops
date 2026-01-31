-- User Settings Tablosu - Kişi renkleri vb. için
-- Bu tabloyu Supabase'te çalıştırın

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,  -- Basit text olarak (profiles tablosu olmadan)
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
);

-- RLS Politikaları
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "User settings are viewable by everyone" 
ON user_settings FOR SELECT 
USING (true);

-- Herkes ekleyebilir (global ayarlar için)
CREATE POLICY "Anyone can insert settings"
ON user_settings FOR INSERT
WITH CHECK (true);

-- Herkes güncelleyebilir
CREATE POLICY "Anyone can update settings"
ON user_settings FOR UPDATE
USING (true);

-- Örnek veri: Member colors
INSERT INTO user_settings (user_id, setting_key, setting_value)
VALUES (
    NULL, -- Global ayar
    'member_colors',
    '{
        "Şeyma Bora": "#E91E63",
        "Fatih Ustaosmanoğlu": "#329FF5",
        "Ayşegül Güler": "#00F5B0",
        "Ahmet Gürkan Turhan": "#9C27B0"
    }'::jsonb
)
ON CONFLICT (user_id, setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = NOW();
