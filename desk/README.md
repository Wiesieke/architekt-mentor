# ArchitectMentor Architecture Desk (osobny projekt Vercel)

**Kod gotowy do przeglądu; niezainstalowany i nieaktywowany.** Ten folder jest rootem **osobnego** projektu Vercel. Nie zmieniaj ustawienia Astro ani domeny `ejsymont.com`. Wersja Node 22+.

## Bezpieczeństwo i granice

- Clerk (prywatny login i MFA) + dokładna allowlista `DESK_ALLOWED_USER_IDS` sprawdzana w *każdym* żądaniu serwerowym. Samo zalogowanie nie uprawnia do dostępu.
- Dwa niezależne sekrety LH API, trzymane w Vercel po stronie serwera; **żadne** klucze/hasła nie trafiają do przeglądarki.
- Własna baza `serwer428682_architectradar`, prefix `amr_`, katalog prywatny `/architectmentor-radar-private`. Zero dostępu do bazy WRYCUT i bazy HLD.
- Tylko ręczne decyzje. Nie ma endpointu publikacji, aktualizacji źródeł ani automatycznego generowania treści. Kandydat nie jest zweryfikowaną wiadomością.
- API zapisowe ma osobny przełącznik `AM_RADAR_EDITOR_WRITE_ENABLED=0` do czasu kontroli.

## Przygotowanie LH.pl (ręczne, po backupie)

1. Potwierdź `SELECT DATABASE();` = **właściwa, dedykowana** baza ArchitectMentor radar, nie HLD ani WRYCUT.
2. Wykonaj jednokrotnie `radar/db/002_architectmentor_editorial_audit.sql`. Wymagana jest kolumna `amr_decisions.revision` i tabela `amr_decision_audit`. Skrypt ALTER nie jest idempotentny; przy ponownym uruchomieniu zgłosi duplikat kolumny.
3. W `/architectmentor-radar-private/config.private.php` dopisz **nowe różne** losowe tokeny `AM_RADAR_API_TOKEN` i `AM_RADAR_EDITOR_API_TOKEN` (32+ znaków), na razie z `AM_RADAR_EDITOR_WRITE_ENABLED=0`. Nie udostępniaj ich przez ChatGPT ani Git.
4. Kopiuj `radar/lh/public/index.php` i `editorial.php` do `~/public_html/mentor-api.sensinte.com/architect-radar-api/` (bez przenoszenia `radar.php` i `config.private.php` do public_html). Alternatywnie ustaw `AM_RADAR_PRIVATE_DIR` na dokładną ścieżkę katalogu prywatnego, jeśli hosting wspiera tę zmienną.
5. Na HTTPS sprawdź: bez Bearer odpowiedź 401; z poprawnym tokenem read API zwraca zdarzenia, bez zapisu; zapis przy wyłączonym przełączniku zwraca 503. Przy nowych kluczach testuj bez ujawniania ich w rozmowie.
6. Dopiero gdy migracja, logowanie i testy autoryzacji są ukończone, można osobno włączyć zapis.

## Oddzielny projekt Vercel

1. Dodaj nowy projekt z repo `Wiesieke/architekt-mentor`, **Root Directory = `desk`**. Nie zmieniaj istniejącego projektu Astro.
2. Skonfiguruj własną aplikację Clerk dla ArchitectMentor; włącz wymóg drugiego czynnika uwierzytelnienia / MFA w konsoli Clerk i ogranicz rejestrację do zaproszonych.
3. Ustaw zmienne z `desk/.env.example`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DESK_ALLOWED_USER_IDS`, URL i Bearer dla osobnych API LH. `DESK_ALLOWED_USER_IDS` musi zawierać rzeczywiste Clerk user ID (np. `user_...`); bez tego każdy odczyt i zapis zwróci odmowę.
4. Sprawdź lokalnie `npm install`, `npm run typecheck`, `npm run build`; nie publikuj bez zielonych testów. Nie dołączaj `.env.local` do repozytorium.
5. Projekt pozostaw w trybie testowym, zanim powstanie decyzja o domenie prywatnego panelu, zaproszonych użytkownikach i włączeniu edycji.

## Kryteria odbioru

- Niezalogowany i zalogowany spoza allowlisty: zero listy wydarzeń i zero zapisu.
- Odczyt danych z dedykowanej bazy, co najmniej 10 wpisów z testu GitHub Changelog.
- Zapis ręcznej decyzji, aktualizacja rewizji i wpis w `amr_decision_audit`.
- Dwa równoległe zapisy tej samej rewizji: jeden dostaje 409 i musi odświeżyć.
- Żadnej publikacji, niezmienione cron i działająca publiczna strona.
