# Architekt-Mentor — wersja produkcyjna (front + proxy)

Generator HLD, w którym **klucz API siedzi po stronie serwera**, a przeglądarka woła Twoją funkcję,
nie API Anthropic. Dzięki temu można to bezpiecznie wystawić ludziom — klucz nie jest widoczny,
Twój prompt też nie.

## Struktura plików (zachowaj dokładnie)

```
architekt-mentor/
├── index.html          ← front (woła /api/generate)
└── api/
    └── generate.js      ← funkcja serverless (trzyma klucz, prompt, limity)
```

`api/generate.js` MUSI leżeć w katalogu `api/` — to na tej podstawie Vercel robi z niego endpoint `/api/generate`.

---

## Wdrożenie na Vercel (najprostsza droga, darmowy plan)

### Wariant A — przez stronę Vercel (bez terminala, polecany na start)

1. Załóż darmowe konto na **vercel.com** (możesz przez GitHub).
2. Wrzuć ten folder do repozytorium GitHub (lub użyj „deploy" z dysku — Vercel obsługuje import folderu).
3. W Vercel: **Add New → Project →** wskaż repozytorium. Framework: **Other** (to statyczny front + funkcja).
4. Zanim klikniesz Deploy, w **Environment Variables** dodaj:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Twój klucz `sk-ant-…`
5. **Deploy.** Po chwili dostaniesz adres typu `https://architekt-mentor.vercel.app`. Wejdź i testuj.

### Wariant B — przez terminal (CLI)

```bash
npm i -g vercel              # jednorazowo
cd architekt-mentor
vercel                       # pierwszy deploy (preview), zaloguje i poprowadzi
vercel env add ANTHROPIC_API_KEY   # wklej klucz; wybierz Production (i Preview)
vercel --prod                # wdrożenie produkcyjne
```

Projekt zawiera `package.json`, ponieważ formularz kontaktowy korzysta z biblioteki Nodemailer do wysyłki przez SMTP.

---

## Zmienna środowiskowa — to jest sedno bezpieczeństwa

Klucza **nigdy nie wpisujesz w kod ani w pliki, które trafiają do repo.** Trzymasz go wyłącznie jako
`ANTHROPIC_API_KEY` w ustawieniach projektu (Environment Variables). Funkcja czyta go z
`process.env.ANTHROPIC_API_KEY`. Po zmianie zmiennej zrób ponowny deploy.

---

## Wbudowane zabezpieczenia kosztów (w `api/generate.js`)

- **Whitelist modeli** — można użyć tylko Haiku/Sonnet/Opus, nic spoza listy.
- **Sufit `max_tokens`** — twardy limit 6000 po stronie serwera, niezależnie od tego, co przyśle front.
- **Limit długości briefu** — odrzuca briefy > 6000 znaków (blokuje próby wymuszenia drogich wywołań).
- **Prosty rate limit** — maks. 8 zapytań / minutę z jednego IP.

> **Uwaga o rate limicie:** to wersja „best-effort" w pamięci instancji. Na serverless funkcje bywają
> mnożone/wygaszane, więc to deterrent, nie twarda gwarancja. Gdy ruch urośnie, dołóż wspólny licznik
> (np. Vercel KV albo Upstash Redis) — wtedy limit działa globalnie.

**Najpewniejszy bezpiecznik na końcu:** w Anthropic Console ustaw **miesięczny limit wydatków**
(spend limit). Cokolwiek się stanie, rachunek nie przekroczy progu, który sam ustawisz. Zrób to od razu.

---

## Alternatywa: Cloudflare Pages / Workers

Działa analogicznie, ale funkcja ma inny kształt: zamiast `module.exports = (req,res)`,
piszesz `export default { async fetch(request, env) { ... } }`, a klucz czytasz z `env.ANTHROPIC_API_KEY`
(ustawiany w panelu Cloudflare jako secret). Reszta logiki (budowa wiadomości, wywołanie API, limity)
jest identyczna. Jeśli wolisz Cloudflare, daj znać — przerobię `generate.js` na ten format.

---

## Jak to testować lokalnie przed wdrożeniem

```bash
npm i -g vercel
cd architekt-mentor
vercel dev        # uruchamia front + funkcję lokalnie pod http://localhost:3000
```
`vercel dev` poprosi o zmienną `ANTHROPIC_API_KEY` (albo dodaj plik `.env.local` z `ANTHROPIC_API_KEY=sk-ant-...`
— i dopisz `.env.local` do `.gitignore`, żeby nie trafił do repo).

---

## Co dalej (gdy podstawa działa)

- Wspólny rate limit (Vercel KV / Upstash) zamiast pamięci instancji.
- Twardy dzienny cap liczby generacji (ochrona kosztu darmowego narzędzia).
- Prosty licznik użycia / log (ile generacji, jakie modele) — przyda się do decyzji o monetyzacji.
- Dopiero potem: konta, zapisywanie projektów, płatności.

## Formularz kontaktowy dla firm

Formularz na `/dlafirm.html` wysyła dane do `/api/enquiry` na Vercel. Funkcja wysyła wiadomość przez SMTP w LH.pl, z adresem odwiedzającego w `Reply-To`. Dane logowania nie są przesyłane do przeglądarki ani do repozytorium.

Do uruchomienia ustaw w projekcie Vercel `project-ead46` zmienne **Production**:

- `LH_SMTP_HOST` — nazwa serwera SMTP z LH.pl, np. `mail-serwerXXXXX.lh.pl` dla hostingu współdzielonego albo `cXXXXX.lh.pl` dla Cloud Server.
- `LH_SMTP_USER` — adres nadawcy w domenie sensinte.com. Zalecana osobna skrzynka `formularz@sensinte.com`; można też użyć `architektura@sensinte.com`.
- `LH_SMTP_PASSWORD` — hasło skrzynki nadawczej. Dodaj jako sekret tylko w panelu Vercel; **nigdy nie podawaj hasła w rozmowie ani w repozytorium**.

Następnie wdróż ponownie projekt, aby funkcja odczytała nowe zmienne, i wyślij próbne zapytanie z formularza. Bez kompletu zmiennych funkcja zwraca 503 oraz adres do bezpośredniego kontaktu. Do czasu zakończenia konfiguracji nie scalaj PR włączającego nowy formularz.

Ograniczenia ochrony: ukryte pole przechwytuje proste boty, a pomocniczy limit 3 zgłoszeń/15 minut/IP działa w pamięci pojedynczej instancji Vercel. Nie jest globalną gwarancją; przy większym ruchu dołóż wspólny limit i weryfikację antybotową po stronie serwera. Nie loguj treści zapytań.


## Opcjonalny zapis briefów/HLD i odpowiedzi na łamigłówki (przygotowane, nieaktywne do konfiguracji)

Zapis jest dobrowolny: pola wyboru są domyślnie odznaczone. Bez ich zaznaczenia treści nadal są przetwarzane przez dotychczasowy model AI, ale aplikacja nie próbuje ich zapisać w bazie. Przy zapisie HLD przechowujemy brief, wynik, model i opcje; przy łamigłówce pierwszą odpowiedź z pytaniem naprowadzającym oraz poprawioną odpowiedź z oceną. Etapy mają wspólny losowy identyfikator próby. Nie zapisujemy w tych tabelach adresu IP, adresu e-mail ani identyfikatora konta. Serwery dostawców mogą prowadzić własne dzienniki techniczne.

Baza `serwer428682_architektmentor` jest oddzielna od WordPressa. Vercel **nie łączy się bezpośrednio z MySQL**. Wysyła żądanie HTTPS do `storage-bridge/save.php` na LH.pl z tajnym tokenem; PHP zapisuje dane do lokalnej bazy przez PDO z zapytaniami parametryzowanymi. Endpoint ma tylko zapis, bez publicznego odczytu. Błąd zapisu nie odbiera użytkownikowi wygenerowanego wyniku.

### Uruchomienie na LH.pl

1. W phpMyAdmin wybierz bazę `serwer428682_architektmentor` i uruchom `storage-bridge/schema.sql`. **Sprawdź wybraną bazę przed importem.** Nie uruchamiaj go w bazie WordPressa.
2. Utwórz pod HTTPS odrębny katalog lub subdomenę na LH.pl z PHP 8.2 lub nowszym. Wgraj `save.php` oraz `.htaccess` do tego katalogu. W tym samym katalogu stwórz `config.local.php` na podstawie `config.example.php`; wpisz host MySQL z panelu LH.pl (`sql189.lh.pl`), nazwę bazy i jej indywidualnego użytkownika, hasło bazy oraz osobny losowy token o długości przynajmniej 32 znaków. Prawdziwy `config.local.php` **nie trafia do repozytorium**. Zabezpiecz dostęp do niego przed HTTP (403).
3. Ustaw w Vercel Production dwa sekrety: `LH_STORAGE_URL` (pełny adres HTTPS zakończony `/save.php`) i `LH_STORAGE_TOKEN` (ten sam losowy token). Hasła MySQL nie wpisuj do Vercel. Po zmianie sekretów wdrożenie musi zostać odświeżone.
4. Wgraj `cleanup.php` do katalogu i skonfiguruj w LH.pl **codzienne zadanie cron z interpreterem PHP**, uruchamiające ten plik. Zapisy mają termin ważności 90 dni, a cron fizycznie usuwa przeterminowane rekordy. Bez działającego crona nie należy deklarować automatycznego usuwania ani włączać funkcji.
5. Przed scaleniem zmian sprawdź, że żądanie bez tokenu zwraca 401, pliki konfiguracyjne nie są dostępne przez WWW, zapis za zgodą pojawia się w obu tabelach, zapis bez zgody nie tworzy rekordu, a po błędzie przechowywania wynik wciąż dociera do użytkownika. Dodaj do informacji o prywatności strony opis celu, zakresu, odbiorców, terminu i sposobu żądania usunięcia. Identyfikator zapisu pokazywany na stronie ułatwia jego odnalezienie do ręcznego usunięcia w phpMyAdmin.

Wskazówka: w LH.pl zdalne połączenie z MySQL może pozostać wyłączone; pośrednik PHP uruchamia się na serwerze bazy. Nie publikuj prawdziwego pliku konfiguracyjnego ani tokenu w GitHubie czy w rozmowie.
