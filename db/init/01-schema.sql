-- Shema podatkovne baze za šolski IS
-- Zasnova: 1 tabela za prijavo (uporabniki) + profilni tabeli + predmeti + 2 povezovalni tabeli (M:N) + gradiva/naloge

-- 1) UPORABNIKI — prijava za vse tri vloge (administrator, ucitelj, ucenec)
CREATE TABLE uporabniki (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  geslo_hash VARCHAR(255) NOT NULL,
  vloga ENUM('administrator', 'ucitelj', 'ucenec') NOT NULL,
  ustvarjeno TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) UCITELJI — profil, vezan na eno vrstico v uporabniki (1:1)
CREATE TABLE ucitelji (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uporabnik_id INT NOT NULL UNIQUE,
  ime VARCHAR(100) NOT NULL,
  priimek VARCHAR(100) NOT NULL,
  FOREIGN KEY (uporabnik_id) REFERENCES uporabniki(id) ON DELETE CASCADE
);

-- 3) UCENCI — profil, vezan na eno vrstico v uporabniki (1:1)
CREATE TABLE ucenci (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uporabnik_id INT NOT NULL UNIQUE,
  ime VARCHAR(100) NOT NULL,
  priimek VARCHAR(100) NOT NULL,
  FOREIGN KEY (uporabnik_id) REFERENCES uporabniki(id) ON DELETE CASCADE
);

-- 4) PREDMETI
CREATE TABLE predmeti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naziv VARCHAR(150) NOT NULL UNIQUE
);

-- 5) UCITELJ_PREDMET — M:N: en učitelj lahko uči več predmetov, en predmet ima lahko več učiteljev
CREATE TABLE ucitelj_predmet (
  ucitelj_id INT NOT NULL,
  predmet_id INT NOT NULL,
  PRIMARY KEY (ucitelj_id, predmet_id),
  FOREIGN KEY (ucitelj_id) REFERENCES ucitelji(id) ON DELETE CASCADE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE
);

-- 6) UCENEC_PREDMET — M:N: en učenec obiskuje več predmetov, en predmet ima lahko več učencev
CREATE TABLE ucenec_predmet (
  ucenec_id INT NOT NULL,
  predmet_id INT NOT NULL,
  PRIMARY KEY (ucenec_id, predmet_id),
  FOREIGN KEY (ucenec_id) REFERENCES ucenci(id) ON DELETE CASCADE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE
);

-- 7) GRADIVA — datoteke, ki jih učitelj naloži za svoj predmet
CREATE TABLE gradiva (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predmet_id INT NOT NULL,
  ucitelj_id INT NOT NULL,
  ime_datoteke VARCHAR(255) NOT NULL,
  pot VARCHAR(500) NOT NULL,
  nalozeno TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (ucitelj_id) REFERENCES ucitelji(id) ON DELETE CASCADE
);

-- 8) NALOGE — oddaje učencev; `potrjeno` uravnava pravilo "ponovna oddaja povozi prejšnjo šele po potrditvi učenca"
CREATE TABLE naloge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predmet_id INT NOT NULL,
  ucenec_id INT NOT NULL,
  ime_datoteke VARCHAR(255) NOT NULL,
  pot VARCHAR(500) NOT NULL,
  oddano TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  potrjeno BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (predmet_id) REFERENCES predmeti(id) ON DELETE CASCADE,
  FOREIGN KEY (ucenec_id) REFERENCES ucenci(id) ON DELETE CASCADE
);
