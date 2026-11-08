# Specifikacija sistema — Šolski IS

Avtor: Črt Peterlin · ER diagram: Matevž Zvir · Pregledal: Jan Marko
Predmet: RPS — Računalniški produkti in storitve · Mentor: Andraž Pušnik

## 1. Namen
Spletna aplikacija podpira šolsko delo na daljavo. Administrator vodi razrede, predmete, učitelje in
učence ter določa, kdo kaj uči v katerem razredu. Učitelji objavljajo gradiva, razpisujejo naloge z
rokom oddaje, pregledujejo oddaje in jih ocenijo. Učenci gradiva prenašajo, oddajajo naloge, prenesejo
svoje oddaje, vidijo ocene in komentarje ter roke v koledarju.

## 2. Uporabniki in vloge
| Vloga | Kako dobi račun | Kaj sme |
|---|---|---|
| Administrator | vnesen v bazo ob namestitvi | upravlja razrede, predmete, učitelje, učence in njihove povezave |
| Učitelj | ustvari ga administrator | gradiva, naloge in ocene samo pri predmetih in v razredih, kjer poučuje |
| Učenec | se registrira sam (izbere razred) ali ga ustvari administrator | svoj profil, izbira predmetov, gradiva, oddaja nalog, ocene, koledar |

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
| A8 | Seznam razredov (npr. 1.A) z dodajanjem, urejanjem in brisanjem. Naziv je obvezen in unikaten. Pri razredu vidi njegove učence in kdo uči kateri predmet. |
| A9 | Pri učitelju v mreži *predmet x razred* izbere, kateri predmet uči v katerem razredu (namesto samo predmeta). |
| A10 | Pri učencu izbere razred. Seznam učencev lahko filtrira po razredu. |
| A11 | Ob brisanju razreda učenci ostanejo brez razreda, naloge in gradiva razreda se izbrišejo. |

### 3.3 Učitelj
| Oznaka | Zahteva |
|---|---|
| U1 | Seznam skupin (predmet v razredu, npr. Matematika 1.A), ki jih poučuje, s številom učencev, nalog in še neocenjenih oddaj. Pod njim so prihajajoči roki. |
| U2 | Pri izbrani skupini naloži gradivo (datoteka do 20 MB). Gradivo vidijo samo učenci tega razreda. |
| U3 | Briše gradiva pri svojih skupinah. |
| U4 | Pregleda in prenese naloge, ki so jih oddali učenci. |
| U5 | Do predmetov in razredov, ki jih ne poučuje, nima dostopa. Vidi samo učence svojih razredov. |
| U6 | Razpiše nalogo za skupino: naslov, navodila, rok oddaje (datum in ura). Nalogo lahko uredi ali izbriše (z oddajami vred). |
| U7 | Pri nalogi vidi vse učence skupine in stanje vsakega: oddano, oddano z zamudo, ni oddano, odprto. |
| U8 | Oddajo oceni (1 do 5) in napiše komentar. Oceno lahko spremeni ali odstrani. |
| U9 | Koledar: roki nalog njegovih skupin po mesecih. |

### 3.4 Učenec
| Oznaka | Zahteva |
|---|---|
| D1 | Registracija: ime, priimek, email, geslo (vsaj 6 znakov, vpisano dvakrat). |
| D2 | Urejanje profila: ime, priimek, email in po želji novo geslo. |
| D3 | Izbira predmetov, ki jih obiskuje (vsaj 2); seznam lahko kadarkoli popravi. |
| D4 | Vpogled in prenos gradiv vsakega predmeta s seznama. |
| D5 | Oddaja naloge: naslov + datoteka. Shrani se kot `Priimek Ime - Naslov naloge.končnica`. |
| D6 | Če naloga z istim imenom že obstaja, sistem vpraša za potrditev. Prejšnja datoteka se povozi šele, ko učenec potrdi; ob preklicu ostane prejšnja. |
| D7 | Ob registraciji izbere svoj razred. Razred vidi v profilu, spremeni ga lahko samo administrator. |
| D8 | Pri predmetu vidi naloge, ki jih je razpisal učitelj njegovega razreda, z rokom in stanjem. Razpisano nalogo odda s klikom nanjo; naslov datoteke je naslov naloge (pravilo D5 in D6 velja enako). Naloga, oddana po roku, je označena *oddano z zamudo*. |
| D9 | Svoje oddaje lahko kadarkoli prenese nazaj. Oddaj drugih učencev ne more odpreti. |
| D10 | Stran *Ocene*: vse ocene in komentarji po predmetih, s povprečjem. Ocenjene naloge ne more več zamenjati. |
| D11 | Domača stran pokaže naloge, ki jih mora še oddati (tudi zamujene), koledar pa vse roke v mesecu. |

## 4. Nefunkcionalne zahteve
- **Varnost gesel:** gesla so shranjena samo zgoščena (bcrypt), nikoli v čistem besedilu.
- **Datoteke** niso javno dostopne; prenese jih samo prijavljen uporabnik s pravico.
- **HTTPS** na javni domeni.
- **Odzivnost:** strani so uporabne tudi na telefonu.
- **Testni podatki:** vsaj 10 predmetov, 20 učiteljev, 100 učencev.

## 5. Podatkovni model
Deset tabel, ER diagram je v `er-diagram.png` (vir: `er-diagram.mmd`), SQL v `db/init/01-schema.sql`.
Obstoječo bazo iz različice 1 posodobi `db/migracije/2026-11-razredi-naloge.sql`.

| Tabela | Namen |
|---|---|
| `uporabniki` | prijava: email, zgoščeno geslo, vloga |
| `ucitelji`, `ucenci` | profil (ime, priimek), vezan na `uporabniki` 1:1; učenec ima še `razred_id` |
| `razredi` | seznam razredov |
| `predmeti` | seznam predmetov |
| `ucitelj_predmet` | kdo uči kateri predmet v katerem razredu (učitelj, predmet, razred) |
| `ucenec_predmet` | katere predmete obiskuje učenec (M:N) |
| `gradiva` | datoteke učiteljev pri predmetu za razred (`razred_id` NULL = vsi razredi) |
| `naloge` | naloge, ki jih učitelj razpiše razredu pri predmetu: naslov, navodila, rok |
| `oddaje` | oddaje učencev; `naloga_id` (NULL pri prosti oddaji), `potrjeno` je FALSE, dokler učenec ne potrdi ponovne oddaje, `ocena` in `komentar` vpiše učitelj |

## 6. Seznam strani
| Pot | Pogled | Opis |
|---|---|---|
| `/prijava` | vsi | prijava |
| `/registracija` | vsi | registracija učenca |
| `/admin` | administrator | pregled (število zapisov) |
| `/admin/razredi` | administrator | razredi (CRUD), `/admin/razredi/:id` učenci in pouk razreda |
| `/admin/predmeti` | administrator | predmeti (CRUD) |
| `/admin/ucitelji` | administrator | učitelji (CRUD + predmeti po razredih) |
| `/admin/ucenci` | administrator | učenci (CRUD + razred + predmeti, filter po razredu) |
| `/ucitelj` | učitelj | moje skupine in prihajajoči roki |
| `/ucitelj/predmet/:id/razred/:id` | učitelj | skupina: naloge, gradiva, učenci, druge oddaje |
| `/ucitelj/naloga/:id` | učitelj | naloga: stanje vseh učencev, prenos oddaj, ocenjevanje |
| `/ucitelj/naloga/:id/uredi` | učitelj | urejanje naloge |
| `/ucenec` | učenec | moji predmeti |
| `/ucenec/profil` | učenec | urejanje profila |
| `/ucenec/predmeti` | učenec | izbira predmetov |
| `/ucenec/predmet/:id` | učenec | naloge, gradiva, druga oddaja |
| `/ucenec/naloga/:id` | učenec | naloga: navodila, rok, oddaja, moja datoteka, ocena |
| `/ucenec/potrdi/:id` | učenec | potrditev ponovne oddaje |
| `/ucenec/ocene` | učenec | moje ocene po predmetih |
| `/koledar` | učitelj, učenec | roki nalog po mesecih |

## 7. Različica 2 (november 2026)
Po pregledu različice 1.0 smo dodali: razrede (A8 do A11), razpisane naloge z rokom (U6, U7, D8),
ocene in komentarje (U8, D10), koledar (U9, D11) in prenos lastnih oddaj (D9). Vse zahteve iz
različice 1 ostanejo, tudi izbira predmetov (D3) in prosta oddaja z vpisanim naslovom (D5, D6).
