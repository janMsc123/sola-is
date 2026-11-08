-- Shema podatkovne baze za šolski IS
-- Zasnova: 1 tabela za prijavo (uporabniki) + profilni tabeli + razredi + predmeti
-- + 2 povezovalni tabeli (M:N) + gradiva + naloge (ki jih razpiše učitelj) + oddaje učencev

-- 1) UPORABNIKI: prijava za vse tri vloge (administrator, ucitelj, ucenec)
CREATE TABLE uporabniki (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  geslo_hash VARCHAR(255) NOT NULL,
  vloga ENUM('administrator', 'ucitelj', 'ucenec') NOT NULL,
  ustvarjeno TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) UCITELJI: profil, vezan na eno vrstico v uporabniki (1:1)
CREATE TABLE ucitelji (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uporabnik_id INT NOT NULL UNIQUE,
  ime VARCHAR(100) NOT NULL,
  priimek VARCHAR(100) NOT NULL,
  FOREIGN KEY (uporabnik_id) REFERENCES uporabniki(id) ON DELETE CASCADE
);

-- 3) RAZREDI: npr. 1.A, 2.A ... vsak učenec je v enem razredu
CREATE TABLE razredi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naziv VARCHAR(20) NOT NULL UNIQUE
);

-- 4) UCENCI: profil, vezan na eno vrstico v uporabniki (1:1)
-- razred_id je lahko prazen (NULL), npr. če administrator razred izbriše
CREATE TABLE ucenci (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uporabnik_id INT NOT NULL UNIQUE,
  ime VARCHAR(100) NOT NULL,
  priimek VARCHAR(100) NOT NULL,
  razred_id INT NULL,
  FOREIGN KEY (uporabnik_id) REFERENCES uporabniki(id) ON DELETE CASCADE,
  FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE SET NULL
);

-- 5) PREDMETI
CREATE TABLE predmeti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naziv VARCHAR(150) NOT NULL UNIQUE
);

-- 6) UCITELJ_PREDMET: kdo uči kateri predmet in v katerem razredu
-- en učitelj lahko uči več predmetov, en predmet ima lahko več učiteljev (vsak v svojih razredih)
CREATE TABLE ucitelj_predmet (
  ucitelj_id INT NOT NULL,
  predmet_id INT NOT NULL,
  razred_id INT NOT NULL,
  PRIMARY KEY (ucitelj_id, predmet_id, razred_id),
  FOREIGN KEY (ucitelj_id) REFERENCES ucitelji(id) ON DELETE CASCADE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE CASCADE
);

-- 7) UCENEC_PREDMET: M:N: en učenec obiskuje več predmetov, en predmet ima lahko več učencev
CREATE TABLE ucenec_predmet (
  ucenec_id INT NOT NULL,
  predmet_id INT NOT NULL,
  PRIMARY KEY (ucenec_id, predmet_id),
  FOREIGN KEY (ucenec_id) REFERENCES ucenci(id) ON DELETE CASCADE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE
);

-- 8) GRADIVA: datoteke, ki jih učitelj naloži za svoj predmet v svojem razredu
-- razred_id = NULL pomeni gradivo za vse razrede (stara gradiva pred uvedbo razredov)
CREATE TABLE gradiva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predmet_id INT NOT NULL,
  ucitelj_id INT NOT NULL,
  razred_id INT NULL,
  ime_datoteke VARCHAR(255) NOT NULL,
  pot VARCHAR(500) NOT NULL,
  nalozeno TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (ucitelj_id) REFERENCES ucitelji(id) ON DELETE CASCADE,
  FOREIGN KEY (razred_id) REFERENCES razredi(id) ON DELETE CASCADE
);

-- 9) NALOGE: naloga, ki jo učitelj razpiše razredu pri predmetu (naslov, navodila, rok oddaje)
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

-- 10) ODDAJE: datoteke, ki jih oddajo učenci
-- naloga_id je NULL, če učenec odda nalogo, ki je učitelj ni razpisal (prosta oddaja)
-- `potrjeno` uravnava pravilo "ponovna oddaja povozi prejšnjo šele po potrditvi učenca"
-- ocena (1 do 5) in komentar vpiše učitelj
CREATE TABLE oddaje (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naloga_id INT NULL,
  predmet_id INT NOT NULL,
  ucenec_id INT NOT NULL,
  ime_datoteke VARCHAR(255) NOT NULL,
  pot VARCHAR(500) NOT NULL,
  oddano TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  potrjeno BOOLEAN NOT NULL DEFAULT FALSE,
  ocena TINYINT NULL CHECK (ocena BETWEEN 1 AND 5),
  komentar TEXT,
  ocenjeno TIMESTAMP NULL,
  FOREIGN KEY (naloga_id) REFERENCES naloge(id) ON DELETE CASCADE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (ucenec_id) REFERENCES ucenci(id) ON DELETE CASCADE
);
