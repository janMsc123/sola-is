# Specifikacija sistema — Šolski IS

Avtorja: Črt Peterlin, Matevž Zvir · Pregledal: Jan Marko
Predmet: RPS — Računalniški produkti in storitve · Mentor: [DOPOLNI]

## 1. Namen
Spletna aplikacija podpira šolsko delo na daljavo. Administrator vodi predmete, učitelje in učence,
učitelji objavljajo gradiva in pregledujejo naloge, učenci gradiva prenašajo in oddajajo naloge.

## 2. Uporabniki in vloge
| Vloga | Kako dobi račun | Kaj sme |
|---|---|---|
| Administrator | vnesen v bazo ob namestitvi | upravlja predmete, učitelje, učence in njihove povezave |
| Učitelj | ustvari ga administrator | gradiva in naloge samo pri predmetih, ki jih poučuje |
| Učenec | se registrira sam ali ga ustvari administrator | svoj profil, izbira predmetov, gradiva, oddaja nalog |

Vsi se prijavijo na isti strani z emailom in geslom. Po prijavi jih sistem preusmeri na stran
njihove vloge. Pravice se preverjajo na strežniku pri vsaki zahtevi.

## 3. Funkcionalne zahteve

### 3.1 Skupno
| Oznaka | Zahteva |
|---|---|
| S1 | Prijava z emailom in geslom. Ob napačnih podatkih sporočilo »Napačen email ali geslo«. |
| S2 | Odjava iz vsake strani (meni v glavi). |
| S3 | Neprijavljen uporabnik je ob obisku katerekoli strani preusmerjen na prijavo. |
| S4 | Uporabnik, ki odpre stran druge vloge, dobi sporočilo »Do te strani nimate dostopa« (403). |

### 3.2 Administrator
| Oznaka | Zahteva |
|---|---|
| A1 | Seznam predmetov z dodajanjem, urejanjem in brisanjem. Naziv je obvezen in unikaten. |
| A2 | Seznam učiteljev z iskanjem, dodajanjem, urejanjem in brisanjem. |
| A3 | Pri učitelju izbere predmete, ki jih poučuje (vsaj 1). En predmet ima lahko več učiteljev. |
| A4 | Seznam učencev z iskanjem, dodajanjem, urejanjem in brisanjem. |
| A5 | Pri učencu izbere predmete, ki jih obiskuje (vsaj 2). |
| A6 | Pri dodajanju se nastavi geslo, pri urejanju se lahko zamenja. |
| A7 | Brisanje zahteva potrditev. Ob brisanju se pobrišejo tudi povezani zapisi. |

### 3.3 Učitelj
| Oznaka | Zahteva |
|---|---|
| U1 | Seznam predmetov, ki jih poučuje, s številom gradiv in oddanih nalog. |
| U2 | Pri izbranem predmetu naloži gradivo (datoteka do 20 MB). |
| U3 | Briše gradiva pri svojih predmetih. |
| U4 | Pregleda in prenese naloge, ki so jih učenci oddali pri predmetu. |
| U5 | Do predmetov, ki jih ne poučuje, nima dostopa. |

### 3.4 Učenec
| Oznaka | Zahteva |
|---|---|
| D1 | Registracija: ime, priimek, email, geslo (vsaj 6 znakov, vpisano dvakrat). |
| D2 | Urejanje profila: ime, priimek, email in po želji novo geslo. |
| D3 | Izbira predmetov, ki jih obiskuje (vsaj 2); seznam lahko kadarkoli popravi. |
| D4 | Vpogled in prenos gradiv vsakega predmeta s seznama. |
| D5 | Oddaja naloge: naslov + datoteka. Shrani se kot `Priimek Ime - Naslov naloge.končnica`. |
| D6 | Če naloga z istim imenom že obstaja, sistem vpraša za potrditev. Prejšnja datoteka se povozi šele, ko učenec potrdi; ob preklicu ostane prejšnja. |

## 4. Nefunkcionalne zahteve
- **Varnost gesel:** gesla so shranjena samo zgoščena (bcrypt), nikoli v čistem besedilu.
- **Datoteke** niso javno dostopne; prenese jih samo prijavljen uporabnik s pravico.
- **HTTPS** na javni domeni.
- **Odzivnost:** strani so uporabne tudi na telefonu.
- **Testni podatki:** vsaj 10 predmetov, 20 učiteljev, 100 učencev.

## 5. Podatkovni model
Osem tabel, ER diagram je v `er-diagram.png`, SQL v `db/init/01-schema.sql`.

| Tabela | Namen |
|---|---|
| `uporabniki` | prijava: email, zgoščeno geslo, vloga |
| `ucitelji`, `ucenci` | profil (ime, priimek), vezan na `uporabniki` 1:1 |
| `predmeti` | seznam predmetov |
| `ucitelj_predmet`, `ucenec_predmet` | povezavi M:N |
| `gradiva` | datoteke učiteljev pri predmetu |
| `naloge` | oddaje učencev; `potrjeno` je FALSE, dokler učenec ne potrdi ponovne oddaje |

## 6. Seznam strani
| Pot | Pogled | Opis |
|---|---|---|
| `/prijava` | vsi | prijava |
| `/registracija` | vsi | registracija učenca |
| `/admin` | administrator | pregled (število zapisov) |
| `/admin/predmeti` | administrator | predmeti (CRUD) |
| `/admin/ucitelji` | administrator | učitelji (CRUD + predmeti) |
| `/admin/ucenci` | administrator | učenci (CRUD + predmeti) |
| `/ucitelj` | učitelj | moji predmeti |
| `/ucitelj/predmet/:id` | učitelj | gradiva in oddane naloge |
| `/ucenec` | učenec | moji predmeti |
| `/ucenec/profil` | učenec | urejanje profila |
| `/ucenec/predmeti` | učenec | izbira predmetov |
| `/ucenec/predmet/:id` | učenec | gradiva in oddaja naloge |
| `/ucenec/potrdi/:id` | učenec | potrditev ponovne oddaje |
