# ArchitectMentor Desk na LH.pl — PHP + hasło + Authenticator (bez abonamentu)

**Status: PR testowy. Nic nie zostało wdrożone na LH.pl. Nie modyfikuj publicznego Astro, Crona ani innych baz.**

To jest nowy wariant panelu redakcyjnego bez Next.js, Vercel, Clerk i GitHub OAuth. Korzysta z istniejącego PHP 8.4, odizolowanej bazy `serwer428682_architectradar` i prywatnej biblioteki radaru. Wszystkie żądania przechodzą przez sesję PHP; nie ma publicznego API Bearer ani automatycznej publikacji.

## Pliki i katalogi

Na LH.pl przez FileZilla utwórz:

- **Katalog publiczny:** `/public_html/mentor-api.sensinte.com/architect-desk/`
- **Istniejący katalog prywatny (poza WWW):** `/architectmentor-radar-private/`, zawierający `radar.php` i `config.private.php`.

Do katalogu publicznego wgraj **tylko** siedem plików z `radar/lh/desk/`:

1. `.htaccess` (ważny plik z kropką — upewnij się, że FileZilla go widzi)
2. `index.php`
3. `api.php`
4. `auth.php`
5. `totp.php`
6. `app.js`
7. `app.css`

**Nie wgrywaj** `README.md`, `tests/`, migracji SQL, `radar.php` ani `config.private.php` do katalogu publicznego.

## Krok A — prywatna konfiguracja

W istniejącym **prywatnym** pliku `/architectmentor-radar-private/config.private.php` dodaj do zwracanej tablicy:

```php
'AM_DESK_SETUP_TOKEN'=>'WPISZ_NOWY_LOSOWY_TAJNY_KLUCZ_MINIMUM_32_ZNAKI',
'AM_DESK_WRITE_ENABLED'=>'0',
```

Klucz instalacyjny wygeneruj lokalnie, np. w menedżerze haseł (losowy, 40+ znaków). **Nie przesyłaj go do ChatGPT i nie publikuj w Git.** Nie używaj hasła do MySQL ani starych tokenów API w roli klucza instalacyjnego.

Skonfigurowany klucz powinien pozostać w prywatnym pliku: jest używany do klucza ochrony przed próbami łamania hasła. Zapis pozostaje `0`.

## Krok B — migracja bazy danych

Po kopii zapasowej otwórz phpMyAdmin dla dedykowanej bazy ArchitectMentor (sprawdź `SELECT DATABASE()` i nazwę bazy). Jednorazowo wykonaj `radar/db/002_architectmentor_editorial_audit.sql`.

Ta migracja dodaje `amr_decisions.revision` oraz `amr_decision_audit`. **Nie jest idempotentna**: nie uruchamiaj ponownie bez sprawdzenia kolumny. Nigdy nie wykonuj jej w bazie WRYCUT ani HLD.

## Krok C — utworzenie konta (raz)

1. Otwórz `https://mentor-api.sensinte.com/architect-desk/index.php`.
2. Na ekranie pierwszej konfiguracji podaj losowy klucz z kroku A, wybierz login i nowe hasło o długości minimum 14 znaków.
3. Kliknij `Utwórz konto`. Serwer zapisze wyłącznie skrót hasła w `/architectmentor-radar-private/architect-desk-auth.json` (uprawnienia 0600) i wygeneruje TOTP.
4. W darmowej aplikacji Authenticator na telefonie dodaj konto ręcznie, wpisując widoczny 32-znakowy klucz Base32; algorytm SHA-1, 6 cyfr, okres 30 s.
5. Bezpiecznie zachowaj prywatny klucz TOTP **poza publicznym serwerem** w menedżerze haseł lub sejfie. Przy utracie telefonu umożliwi odzyskanie dostępu.
6. Podaj ponownie klucz instalacyjny i sześciocyfrowy kod z aplikacji; zakończ konfigurację.
7. Zaloguj się nowym loginem, hasłem i kodem. Nie wysyłaj żadnego z tych sekretów w rozmowie.

Po zakończeniu instalacji formularz ponownej rejestracji jest zamknięty. Próby logowania są ograniczane: 8 błędów w 30 min blokuje kolejne. Sesja wygasa po 30 minutach bezczynności i maksymalnie po 8 godzinach. `SameSite=Strict`, `HttpOnly`, `Secure` cookies i losowe tokeny CSRF zabezpieczają żądania.

## Krok D — testy przed uruchomieniem zapisu

- Adres musi działać wyłącznie przez HTTPS. Strony `auth.php` i `totp.php` mają zwracać 403.
- Niezalogowane wywołanie `api.php?action=items` ma zwracać 401.
- Po zalogowaniu widać rekordy z **tylko** bazy ArchitectMentor, listę źródeł i kolejkę.
- Bez względu na uprawnienia i gotowość migracji, przy `AM_DESK_WRITE_ENABLED=0` nie można zapisać decyzji (503).
- Przywróć ustawienie `AM_DESK_WRITE_ENABLED=0` przed każdym testem podejrzanym.
- Po formalnym odbiorze i kopii zapasowej możesz osobno zezwolić na zapis, ustawiając **obydwa** prywatne przełączniki: `AM_DESK_WRITE_ENABLED=1` i `AM_RADAR_EDITOR_WRITE_ENABLED=1`.
- Po włączeniu zapisu: test jednej ręcznej decyzji, wzrostu `revision`, wiersza w `amr_decision_audit`, konfliktu 409 przy starszej rewizji; bez publikacji.
- Żadna modyfikacja Crona i źródeł nie jest potrzebna.

## Bezpieczeństwo i ograniczenia

- Jedno konto administratora; brak rejestracji publicznej, resetu hasła e-mailem, samodzielnego zakładania użytkowników i zewnętrznych usług.
- Hasło jest hashowane przez PHP `password_hash` (Argon2id jeśli serwer obsługuje); TOTP według RFC 6238, bez zewnętrznego serwisu QR.
- Prywatny katalog musi pozostać **poza** katalogiem WWW. PHP w panelu odmawia użycia prywatnego katalogu umieszczonego wewnątrz webroota.
- Wszystkie operacje edytorskie są wykonywane na serwerze i rejestrowane w tabeli audytowej; ich autor pochodzi z sesji.
- `auth.json` i `architect-desk-attempts.json` powstają na serwerze w katalogu prywatnym; nie przesyłaj ich nikomu.
- Wersja Next.js pozostaje w oddzielnym **starym draftowym PR**; ten PHP Desk nie wymaga jej wdrażania.

## Testy automatyczne

GitHub Actions sprawdza `php -l` dla wszystkich plików PHP, standardowy wektor RFC 6238 i `node --check` dla JS. To **nie zastępuje** testu logowania i izolacji bazy na LH.pl po ręcznej instalacji.
