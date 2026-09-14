-- Osnovna shema — razvijalca jo dopolnita v tednu 2 na podlagi ER diagrama.
-- Zaenkrat samo placeholder tabela, da baza ni prazna.

CREATE TABLE IF NOT EXISTS meta_info (
  kljuc VARCHAR(64) PRIMARY KEY,
  vrednost VARCHAR(255) NOT NULL,
  posodobljeno TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO meta_info (kljuc, vrednost) VALUES
  ('shema_verzija', '0.1'),
  ('projekt', 'sola-is')
ON DUPLICATE KEY UPDATE vrednost=VALUES(vrednost);
