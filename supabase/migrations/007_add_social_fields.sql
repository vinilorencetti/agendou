-- Adiciona campos de redes sociais ao tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram TEXT;
