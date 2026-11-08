-- Posodobitev obstoječe baze na različico 2 (razredi, razpisane naloge, ocene)
--
-- Skripte v db/init se izvedejo samo ob PRVEM zagonu prazne baze. Baza na strežniku že ima
-- podatke, zato jo posodobimo s to skripto, ENKRAT, ročno:
--   docker exec -i sola-is-baza-1 mariadb -u<uporabnik> -p<geslo> sola_is < db/migracije/2026-11-razredi-naloge.sql
-- Pred tem naredimo varnostno kopijo (scripts/backup.sh).
--
-- Kaj naredi:
--   1) nova tabela razredi (1.A do 4.A), vsak učenec dobi razred
--   2) ucitelj_predmet dobi stolpec razred_id: učitelji predmeta si razrede razdelijo po vrsti
--   3) gradiva dobijo razred_id (stara gradiva ostanejo za vse razrede: NULL)
--   4) dosedanja tabela naloge (oddaje učencev) se preimenuje v oddaje in dobi oceno in komentar
--   5) nova tabela naloge (naloge, ki jih razpiše učitelj) s primeri nalog

-- ===== 1) RAZREDI =====
CREATE TABLE razredi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naziv VARCHAR(20) NOT NULL UNIQUE
);
INSERT INTO razredi (naziv) VALUES ('1.A'), ('2.A'), ('3.A'), ('4.A');

ALTER TABLE ucenci
  ADD COLUMN razred_id INT NULL,
  ADD FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE SET NULL;

-- učenci po vrsti v 1.A, 2.A, 3.A, 4.A, 1.A ...
UPDATE ucenci SET razred_id = MOD(id - 1, 4) + 1;

-- ===== 2) KDO UČI V KATEREM RAZREDU =====
-- Naredimo novo tabelo s stolpcem razred_id in vanjo prepišemo stare podatke.
-- Učitelje istega predmeta oštevilčimo (mesto 0, 1, 2 ...) in vsak dobi razrede,
-- pri katerih je (razred - 1) MOD (število učiteljev) enako njegovemu mestu.
-- Pri dveh učiteljih: prvi dobi 1.A in 3.A, drugi 2.A in 4.A.
CREATE TABLE ucitelj_predmet_nova (
  ucitelj_id INT NOT NULL,
  predmet_id INT NOT NULL,
  razred_id INT NOT NULL,
  PRIMARY KEY (ucitelj_id, predmet_id, razred_id),
  FOREIGN KEY (ucitelj_id) REFERENCES ucitelji(id) ON DELETE CASCADE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE CASCADE
);

INSERT INTO ucitelj_predmet_nova (ucitelj_id, predmet_id, razred_id)
SELECT t.ucitelj_id, t.predmet_id, r.id
FROM (
  SELECT ucitelj_id, predmet_id,
    ROW_NUMBER() OVER (PARTITION BY predmet_id ORDER BY ucitelj_id) - 1 AS mesto,
    COUNT(*) OVER (PARTITION BY predmet_id) AS st_uciteljev
  FROM ucitelj_predmet
) t
JOIN razredi r ON MOD(r.id - 1, t.st_uciteljev) = t.mesto;

DROP TABLE ucitelj_predmet;
RENAME TABLE ucitelj_predmet_nova TO ucitelj_predmet;

-- ===== 3) GRADIVA ZA RAZRED =====
ALTER TABLE gradiva
  ADD COLUMN razred_id INT NULL AFTER ucitelj_id,
  ADD FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE CASCADE;

-- ===== 4) ODDAJE =====
RENAME TABLE naloge TO oddaje;

-- ===== 5) RAZPISANE NALOGE =====
CREATE TABLE naloge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predmet_id INT NOT NULL,
  razred_id INT NOT NULL,
  ucitelj_id INT NOT NULL,
  naslov VARCHAR(150) NOT NULL,
  navodila TEXT,
  rok DATETIME NOT NULL,
  ustvarjeno TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE CASCADE,
  FOREIGN KEY (ucitelj_id) REFERENCES ucitelji(id) ON DELETE CASCADE
);

ALTER TABLE oddaje
  ADD COLUMN naloga_id INT NULL AFTER id,
  ADD COLUMN ocena TINYINT NULL CHECK (ocena BETWEEN 1 AND 5),
  ADD COLUMN komentar TEXT,
  ADD COLUMN ocenjeno TIMESTAMP NULL,
  ADD FOREIGN KEY (naloga_id) REFERENCES naloge(id) ON DELETE CASCADE;

-- primeri nalog (enako kot v db/init/02-testni-podatki.sql)
INSERT INTO naloge (predmet_id, razred_id, ucitelj_id, naslov, navodila, rok)
SELECT up.predmet_id, up.razred_id, up.ucitelj_id, 'Domača naloga 1',
  CONCAT('Reši vaje iz učbenika pri predmetu ', p.naziv, ' in oddaj rešitve kot PDF.'),
  TIMESTAMP(CURDATE() - INTERVAL 4 DAY, '23:59:00')
FROM ucitelj_predmet up JOIN predmeti p ON p.id = up.predmet_id;

INSERT INTO naloge (predmet_id, razred_id, ucitelj_id, naslov, navodila, rok)
SELECT up.predmet_id, up.razred_id, up.ucitelj_id, 'Domača naloga 2',
  CONCAT('Ponovi snov zadnjih dveh ur pri predmetu ', p.naziv, ' in odgovori na vprašanja iz gradiva.'),
  TIMESTAMP(CURDATE() + INTERVAL (3 + MOD(up.predmet_id, 5)) DAY, '23:59:00')
FROM ucitelj_predmet up JOIN predmeti p ON p.id = up.predmet_id;

INSERT INTO naloge (predmet_id, razred_id, ucitelj_id, naslov, navodila, rok)
SELECT up.predmet_id, up.razred_id, up.ucitelj_id, 'Seminarska naloga',
  CONCAT('Izberi temo pri predmetu ', p.naziv, ', napiši 3 do 5 strani in oddaj dokument (PDF ali Word).'),
  TIMESTAMP(CURDATE() + INTERVAL (14 + up.predmet_id) DAY, '23:59:00')
FROM ucitelj_predmet up JOIN predmeti p ON p.id = up.predmet_id;
