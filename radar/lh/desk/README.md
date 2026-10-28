# ArchitectMentor Desk — LH.pl „open_basedir” edition (wariant awaryjny)

> **Rozszerzenie v0.4 (Szkice artykułów):** osobna instrukcja bezpiecznej migracji 004 i wgrania przez FileZilla znajduje się w [DRAFTS_DEPLOY.md](DRAFTS_DEPLOY.md). Nie wykonuj poniższej ponownej instalacji konta — działającego uwierzytelniania nie zmieniamy.

**Status: draft / bezpieczeństwo do potwierdzenia na hostingu.** Wersja pierwotna wymagała dostępu do `/architectmentor-radar-private` spoza vhosta, a LH.pl zwróciło `open_basedir restriction`. Ta wersja działa wewnątrz dozwolonego katalogu domeny, **bez zmiany ograniczeń PHP** i bez ingerencji w istniejący Cron, radar, WRYCUT ani stronę publiczną.

## Ważny kompromis bezpieczeństwa

Ten wariant używa `architect-desk/.vault/` **fizycznie pod public_html**, ale wymaga dwóch niezależnych reguł Apache blokujących HTTP do tego podkatalogu. Nie jest to tak silna izolacja jak prywatny katalog poza WWW. Jeśli LH.pl umożliwi dostęp PHP do prywatnego katalogu poza WWW, **preferuj wersję pierwotną**.

**NIE kopiuj haseł ani konfiguracji do .vault, dopóki test HTTP nie zwróci 403.** Zabezpieczenia `.htaccess` mogą przestać działać po zmianie konfiguracji serwera; regularnie sprawdzaj blokadę. Nie przechowuj kopii `.bak`, `.txt` czy ZIP z hasłami w public_html. Wszystkie pliki konfiguracji PHP zachowują `<?php return [...];` (nie zwykły tekst).

## Krok 1 — aktualizacja kodu PHP na LH.pl

Z gałęzi `feature/architectmentor-lh-php-desk-20261028`, katalog `radar/lh/desk`, prześlij przez FileZilla do:
`/public_html/mentor-api.sensinte.com/architect-desk/`

- `.htaccess` (**nadpisz stary**)
- `auth.php` (**nadpisz stary**)
- `desk-db.php` (**nowy, nie zawiera sekretów**)
- zachowaj bez zmian poprzednie `api.php`, `index.php`, `totp.php`, `app.js`, `app.css`.

Nie przesyłaj `README.md`, katalogu `tests/` ani migracji SQL.

## Krok 2 — TEST BEZPIECZEŃSTWA: przed kopiowaniem sekretów

W katalogu `architect-desk/` utwórz podkatalog `.vault/` i prześlij z repozytorium tylko dwa pliki:

- `.vault/.htaccess` (blokada: `Require all denied`)
- `.vault/deny-test.txt` (tekst **bez sekretów**).

Sprawdź z przeglądarki (także w karcie incognito):

`https://mentor-api.sensinte.com/architect-desk/.vault/deny-test.txt`

**Wynik wymagany: HTTP 403 Forbidden.** Jeśli widzisz tekst testowy, jest 200, lub nietypowa odpowiedź — **STOP**. Nie wgrywaj żadnych sekretów, zgłoś blokadę. Odmowa 404 również wymaga wyjaśnienia; nie traktuj automatycznie jako potwierdzenia.

Gdy test przejdzie, sprawdź również przez domenę techniczną LH, jeśli jest skonfigurowana w sposób umożliwiający dotarcie do katalogu. Każda ścieżka HTTP do `.vault` musi być blokowana.

## Krok 3 — kopia konfiguracji dla samego panelu (po 403)

**Nie przenoś** oryginału `/architectmentor-radar-private/config.private.php`: jest niezbędny działającemu radarowi i pozostaje nietknięty.

Po wykonaniu backupu skopiuj przez FileZilla istniejący, prywatny plik `config.private.php` (ten zawierający wpisy `AM_DESK_SETUP_TOKEN` i `AM_DESK_WRITE_ENABLED=>'0'`) do:

`/public_html/mentor-api.sensinte.com/architect-desk/.vault/config.private.php`

Nigdy do samego `architect-desk/`. Ustaw uprawnienia 0600, o ile PHP na LH potrafi taki plik odczytać; w razie odmowy odczytu nie rozszerzaj uprawnień na publiczne, najpierw diagnozuj. Nie publikuj pliku ani zrzutów z zawartością.

`auth.php` zapisuje w `.vault/` również `architect-desk-auth.json` (skrót hasła + klucz TOTP) oraz `architect-desk-attempts.json`. Te pliki muszą podlegać tej samej blokadzie HTTP.

## Krok 4 — migracja wyłącznie bazy ArchitectMentor

Po backupie w phpMyAdmin:
1. Sprawdź `SELECT DATABASE();` i upewnij się, że to **serwer428682_architectradar**, nie WRYCUT.
2. Sprawdź `SHOW COLUMNS FROM amr_decisions LIKE 'revision';` i `SHOW TABLES LIKE 'amr_decision_audit';`.
3. Jeśli obie zmiany jeszcze nie istnieją, wykonaj **raz** `radar/db/002_architectmentor_editorial_audit.sql`. Migracja nie jest idempotentna.

## Krok 5 — logowanie

Otwórz `https://mentor-api.sensinte.com/architect-desk/`; przy pierwszym wejściu użyj klucza instalacyjnego z **kopii** konfiguracji, nowego loginu, silnego hasła i skonfiguruj TOTP w Authenticatorze. Nie wysyłaj sekretów ani kodów w czacie.

Sprawdź:
- `/.vault/deny-test.txt` — 403.
- `/.vault/config.private.php` — 403.
- `/auth.php`, `/totp.php`, `/desk-db.php` — 403.
- `/api.php?action=items` bez sesji — 401.
- Panel po zalogowaniu czyta tylko bazę ArchitectMentor.
- Zapis pozostaje niedostępny przy `AM_DESK_WRITE_ENABLED=0`; dwa przełączniki nie mogą być samoczynnie aktywowane.

Jeśli jakakolwiek reguła 403 przestaje działać, nie używaj panelu; usuń **kopię konfiguracji z .vault** z zachowaniem bezpiecznego backupu i skontaktuj się ze wsparciem LH.pl.

## Ograniczenia

- Izolacja opiera się na Apache `.htaccess`, a nie na fizycznej lokalizacji poza dokument root.
- Żaden sekret nie trafia do repozytorium. `.vault/config.private.php` powstaje tylko na serwerze przez użytkownika.
- Brak automatycznej publikacji, brak dodatkowego Crona.
- PHP 8.0+, hasło `password_hash`, TOTP 6 cyfr, sesja Secure/HttpOnly/SameSite Strict, CSRF, 8 nieudanych prób w 30 min.
- Testy GitHub nie potrafią potwierdzić skuteczności `.htaccess` na LH.pl; sprawdzian 403 jest obowiązkowym etapem ręcznym.
