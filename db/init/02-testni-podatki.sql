-- Testni podatki za šolski IS
-- Ta datoteka se izvede samo ob PRVEM zagonu prazne baze (za 01-schema.sql).
-- Vsi testni uporabniki imajo geslo: geslo123
-- V bazi je shranjeno samo zgoščeno (bcrypt), nikoli v čistem besedilu.

-- ============ 1) ADMINISTRATOR ============
-- dobi id 1 v tabeli uporabniki
INSERT INTO uporabniki (email, geslo_hash, vloga) VALUES
('admin@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'administrator');

-- ============ 2) RAZREDI (4) ============
INSERT INTO razredi (naziv) VALUES
('1.A'),
('2.A'),
('3.A'),
('4.A');

-- ============ 2b) PREDMETI (10) ============
INSERT INTO predmeti (naziv) VALUES
('Matematika'),
('Slovenščina'),
('Angleščina'),
('Fizika'),
('Kemija'),
('Biologija'),
('Zgodovina'),
('Geografija'),
('Informatika'),
('Športna vzgoja');

-- ============ 3) UČITELJI (20) ============
-- najprej račun za prijavo (uporabniki id 2-21) ...
INSERT INTO uporabniki (email, geslo_hash, vloga) VALUES
('petra.bizjak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('zala.pirc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('nik.klemencic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('domen.krajnc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('matic.mlakar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('lara.zajc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('domen.zagar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('teja.kovac@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('hana.zupan@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('luka.kralj@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('sara.hribar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('rok.zagar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('matic.zupancic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('anze.jerman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('petra.koren@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('anze.kos@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('luka.novak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('tilen.kralj@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('matic.golob@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj'),
('lan.rozman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucitelj');

-- ... potem še profil z imenom in priimkom (ucitelji id 1-20)
INSERT INTO ucitelji (uporabnik_id, ime, priimek) VALUES
(2, 'Petra', 'Bizjak'),
(3, 'Zala', 'Pirc'),
(4, 'Nik', 'Klemenčič'),
(5, 'Domen', 'Krajnc'),
(6, 'Matic', 'Mlakar'),
(7, 'Lara', 'Zajc'),
(8, 'Domen', 'Žagar'),
(9, 'Teja', 'Kovač'),
(10, 'Hana', 'Zupan'),
(11, 'Luka', 'Kralj'),
(12, 'Sara', 'Hribar'),
(13, 'Rok', 'Žagar'),
(14, 'Matic', 'Zupančič'),
(15, 'Anže', 'Jerman'),
(16, 'Petra', 'Koren'),
(17, 'Anže', 'Kos'),
(18, 'Luka', 'Novak'),
(19, 'Tilen', 'Kralj'),
(20, 'Matic', 'Golob'),
(21, 'Lan', 'Rozman');

-- ============ 4) UČENCI (100) ============
-- račun za prijavo (uporabniki id 22-121)
INSERT INTO uporabniki (email, geslo_hash, vloga) VALUES
('aljaz.zorko@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tilen.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('aljaz.zagar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('vid.horvat@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lara.kolar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('matic.vidmar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('miha.zupancic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ana.kavcic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('manca.rupnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('luka.breznik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ana.zupancic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('vid.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('vid.zajc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('eva.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tjasa.zajc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('rok.krajnc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('miha.horvat@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('zala.hocevar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('nik.sever@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('sara.petek@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('maja.rupnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('luka.koren@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jan.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('petra.bozic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('mark.zupan@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('neza.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('urska.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('spela.bizjak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('neza.kovac@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('julija.petek@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lan.kovacic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ema.potocnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tilen.kastelic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('urska.jerman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lara.vidmar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ana.hribar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('teja.potocnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('vid.rozman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('vid.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jakob.vidmar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('matic.krajnc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jakob.breznik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('teja.hocevar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jan.zupan@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('manca.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('miha.klemencic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('sara.vidmar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('zan.kovacic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('katja.kastelic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tilen.kos@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('hana.kos@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('sara.kovac@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('matic.kosir@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('zan.kolar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lan.vidmar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('neza.jerman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('matic.pirc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('neza.knez@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('eva.zajc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('klemen.kotnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tjasa.hocevar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('gal.mlakar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('maja.zorko@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('rok.knez@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ana.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jakob.knez@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('klemen.medved@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lana.medved@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lara.zupancic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('zala.rupnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jan.kavcic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lara.sever@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('klemen.knez@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('miha.kotnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('julija.novak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tjasa.sever@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('miha.rozman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('klemen.klemencic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lan.medved@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('zala.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('klemen.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('sara.oblak@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('rok.koren@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('lara.kastelic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('spela.vidmar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('spela.golob@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('aljaz.petek@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('tjasa.kotnik@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jakob.kolar@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('matic.jerman@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('julija.pirc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('sara.kavcic@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('petra.sever@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('klemen.horvat@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('aljaz.golob@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('julija.koren@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('petra.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ziga.turk@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('jan.zajc@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec'),
('ziga.golob@sola.si', '$2b$10$eqh6ZdmT86KffGSyx7y7zO990P3dpF.ksKxsK7EctSsfjVYd3FnAu', 'ucenec');

-- profil učenca (ucenci id 1-100)
INSERT INTO ucenci (uporabnik_id, ime, priimek) VALUES
(22, 'Aljaž', 'Zorko'),
(23, 'Tilen', 'Turk'),
(24, 'Aljaž', 'Žagar'),
(25, 'Vid', 'Horvat'),
(26, 'Lara', 'Kolar'),
(27, 'Matic', 'Vidmar'),
(28, 'Miha', 'Zupančič'),
(29, 'Ana', 'Kavčič'),
(30, 'Manca', 'Rupnik'),
(31, 'Luka', 'Breznik'),
(32, 'Ana', 'Zupančič'),
(33, 'Vid', 'Oblak'),
(34, 'Vid', 'Zajc'),
(35, 'Eva', 'Turk'),
(36, 'Tjaša', 'Zajc'),
(37, 'Rok', 'Krajnc'),
(38, 'Miha', 'Horvat'),
(39, 'Zala', 'Hočevar'),
(40, 'Nik', 'Sever'),
(41, 'Sara', 'Petek'),
(42, 'Maja', 'Rupnik'),
(43, 'Luka', 'Koren'),
(44, 'Jan', 'Turk'),
(45, 'Petra', 'Božič'),
(46, 'Mark', 'Zupan'),
(47, 'Neža', 'Oblak'),
(48, 'Urška', 'Oblak'),
(49, 'Špela', 'Bizjak'),
(50, 'Neža', 'Kovač'),
(51, 'Julija', 'Petek'),
(52, 'Lan', 'Kovačič'),
(53, 'Ema', 'Potočnik'),
(54, 'Tilen', 'Kastelic'),
(55, 'Urška', 'Jerman'),
(56, 'Lara', 'Vidmar'),
(57, 'Ana', 'Hribar'),
(58, 'Teja', 'Potočnik'),
(59, 'Vid', 'Rozman'),
(60, 'Vid', 'Turk'),
(61, 'Jakob', 'Vidmar'),
(62, 'Matic', 'Krajnc'),
(63, 'Jakob', 'Breznik'),
(64, 'Teja', 'Hočevar'),
(65, 'Jan', 'Zupan'),
(66, 'Manca', 'Oblak'),
(67, 'Miha', 'Klemenčič'),
(68, 'Sara', 'Vidmar'),
(69, 'Žan', 'Kovačič'),
(70, 'Katja', 'Kastelic'),
(71, 'Tilen', 'Kos'),
(72, 'Hana', 'Kos'),
(73, 'Sara', 'Kovač'),
(74, 'Matic', 'Košir'),
(75, 'Žan', 'Kolar'),
(76, 'Lan', 'Vidmar'),
(77, 'Neža', 'Jerman'),
(78, 'Matic', 'Pirc'),
(79, 'Neža', 'Knez'),
(80, 'Eva', 'Zajc'),
(81, 'Klemen', 'Kotnik'),
(82, 'Tjaša', 'Hočevar'),
(83, 'Gal', 'Mlakar'),
(84, 'Maja', 'Zorko'),
(85, 'Rok', 'Knez'),
(86, 'Ana', 'Turk'),
(87, 'Jakob', 'Knez'),
(88, 'Klemen', 'Medved'),
(89, 'Lana', 'Medved'),
(90, 'Lara', 'Zupančič'),
(91, 'Zala', 'Rupnik'),
(92, 'Jan', 'Kavčič'),
(93, 'Lara', 'Sever'),
(94, 'Klemen', 'Knez'),
(95, 'Miha', 'Kotnik'),
(96, 'Julija', 'Novak'),
(97, 'Tjaša', 'Sever'),
(98, 'Miha', 'Rozman'),
(99, 'Klemen', 'Klemenčič'),
(100, 'Lan', 'Medved'),
(101, 'Zala', 'Oblak'),
(102, 'Klemen', 'Oblak'),
(103, 'Sara', 'Oblak'),
(104, 'Rok', 'Koren'),
(105, 'Lara', 'Kastelic'),
(106, 'Špela', 'Vidmar'),
(107, 'Špela', 'Golob'),
(108, 'Aljaž', 'Petek'),
(109, 'Tjaša', 'Kotnik'),
(110, 'Jakob', 'Kolar'),
(111, 'Matic', 'Jerman'),
(112, 'Julija', 'Pirc'),
(113, 'Sara', 'Kavčič'),
(114, 'Petra', 'Sever'),
(115, 'Klemen', 'Horvat'),
(116, 'Aljaž', 'Golob'),
(117, 'Julija', 'Koren'),
(118, 'Petra', 'Turk'),
(119, 'Žiga', 'Turk'),
(120, 'Jan', 'Zajc'),
(121, 'Žiga', 'Golob');

-- razred učenca: po vrsti 1.A, 2.A, 3.A, 4.A, 1.A ... (25 učencev v vsakem razredu)
-- MOD(id - 1, 4) je ostanek pri deljenju s 4, torej 0, 1, 2 ali 3
UPDATE ucenci SET razred_id = MOD(id - 1, 4) + 1;

-- ============ 5) KDO UČI KAJ IN V KATEREM RAZREDU (ucitelj_predmet) ============
-- vsak predmet imata vsaj 2 učitelja, vsak uči v svojih razredih,
-- učitelji 1-5 učijo po 2 predmeta, zato imajo nekateri predmeti 3 učitelje.
-- V vsakem razredu uči posamezen predmet natanko en učitelj.
-- (ucitelj_id, predmet_id, razred_id), razred 1 = 1.A ... 4 = 4.A
INSERT INTO ucitelj_predmet (ucitelj_id, predmet_id, razred_id) VALUES
(1, 1, 1),
(1, 1, 3),
(1, 6, 1),
(1, 6, 4),
(2, 2, 1),
(2, 2, 3),
(2, 7, 1),
(2, 7, 4),
(3, 3, 1),
(3, 3, 3),
(3, 8, 1),
(3, 8, 4),
(4, 4, 1),
(4, 4, 3),
(4, 9, 1),
(4, 9, 4),
(5, 5, 1),
(5, 5, 3),
(5, 10, 1),
(5, 10, 4),
(6, 6, 2),
(7, 7, 2),
(8, 8, 2),
(9, 9, 2),
(10, 10, 2),
(11, 1, 2),
(11, 1, 4),
(12, 2, 2),
(12, 2, 4),
(13, 3, 2),
(13, 3, 4),
(14, 4, 2),
(14, 4, 4),
(15, 5, 2),
(15, 5, 4),
(16, 6, 3),
(17, 7, 3),
(18, 8, 3),
(19, 9, 3),
(20, 10, 3);

-- ============ 6) KAJ OBISKUJE UČENEC (ucenec_predmet) ============
-- vsak učenec obiskuje 3 predmete.
-- Namesto 300 vrstic na roko uporabimo MOD (ostanek pri deljenju z 10):
-- učenec 1 dobi predmete 2, 5, 8; učenec 2 dobi 3, 6, 9 ... in tako naprej.
INSERT INTO ucenec_predmet (ucenec_id, predmet_id)
SELECT id, MOD(id, 10) + 1 FROM ucenci;

INSERT INTO ucenec_predmet (ucenec_id, predmet_id)
SELECT id, MOD(id + 3, 10) + 1 FROM ucenci;

INSERT INTO ucenec_predmet (ucenec_id, predmet_id)
SELECT id, MOD(id + 6, 10) + 1 FROM ucenci;

-- ============ 7) RAZPISANE NALOGE ============
-- Vsak učitelj razpiše v vsakem svojem razredu tri naloge: eno z rokom, ki je že potekel,
-- in dve s prihodnjim rokom. Roki so izračunani od dneva namestitve (CURDATE), da je
-- koledar vedno živ. Rok je ob 23:59.
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
