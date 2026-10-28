# ArchitectMentor Architecture Desk — prywatny panel

**Status:** osobny projekt Next.js w draftowym PR; nic nie zostało wdrożone na Vercel ani LH.pl. Nie zmieniaj produkcyjnego Astro `ejsymont.com` i istniejącego Crona.

## Funkcje i separacja

- Panel pobiera kandydatów ArchitectMentor Radar przez chroniony odczytowy endpoint LH.pl z dedykowanej bazy `serwer428682_architectradar` (tabele `amr_`).
- Umożliwia **ręczne** decyzje redakcyjne, zmianę rewizji i zapis do `amr_decisions` oraz `amr_decision_audit`.
- Brak automatycznego sprawdzania faktów, publikowania, generowania artykułów, edycji źródeł czy uruchamiania Crona. Bazy WRYCUT i HLD pozostają nietknięte.

## Uwierzytelnianie bez abonamentu

- Logowanie GitHub OAuth przez **Auth.js**. Nie wymaga subskrypcji Clerk ani nowej bazy użytkowników.
- Serwerowa allowlista `DESK_ALLOWED_GITHUB_IDS` zawiera dokładne numeryczne GitHub ID, rozdzielone przecinkami. Jest sprawdzana podczas OAuth oraz **przed każdym** odczytem i zapisem. Gdy pusta — odmowa dostępu.
- Włącz 2FA na kontach GitHub dopuszczonych do pracy redakcyjnej. Panel nie wymusza osobno wyzwania MFA przy każdej sesji.
- Utwórz **oddzielną GitHub OAuth App** dla ArchitectMentor (nie współdziel konfiguracji WRYCUT). Callback: `https://TWOJ-ADRES-PANELU/api/auth/callback/github`. Nie żądaj uprawnienia `repo`.
- Sekrety `AUTH_SECRET`, `AUTH_GITHUB_SECRET` i oba tokeny LH są dostępne wyłącznie po stronie serwera Vercel. Nie umieszczaj ich w Git ani w rozmowie.

## Przygotowanie LH.pl (ręcznie, po backupie)

1. Zweryfikuj `SELECT DATABASE();` przed operacją: jedynie dedykowana baza ArchitectMentor, nie HLD i nie WRYCUT.
2. Po kopii bezpieczeństwa wykonaj jednokrotnie `radar/db/002_architectmentor_editorial_audit.sql` — kolumna `amr_decisions.revision` i tabela `amr_decision_audit`. Migracja ALTER nie jest idempotentna.
3. W prywatnym `/architectmentor-radar-private/config.private.php` ustaw **różne** nowe tokeny `AM_RADAR_API_TOKEN` i `AM_RADAR_EDITOR_API_TOKEN` (co najmniej 32 znaki); `AM_RADAR_EDITOR_WRITE_ENABLED=0` do odbioru.
4. Przenieś wyłącznie `radar/lh/public/index.php` i `editorial.php` do `~/public_html/mentor-api.sensinte.com/architect-radar-api/`, a konfigurację pozostaw poza `public_html`.
5. Przetestuj odmowę 401 bez Bearer, poprawny read z Bearer i 503 dla wyłączonego write.

## Osobny projekt Vercel

1. Utwórz osobny projekt z repo `Wiesieke/architekt-mentor`, **Root Directory = `desk`**. Nie przestawiaj projektu Astro.
2. Po ustaleniu docelowego HTTPS adresu Vercel utwórz GitHub OAuth App i ustaw w jej konfiguracji dokładny callback `https://TWOJ-ADRES-PANELU/api/auth/callback/github`.
3. W prywatnych zmiennych Vercel ustaw `AUTH_SECRET` (losowy, unikalny dla panelu), `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `DESK_ALLOWED_GITHUB_IDS` oraz zmienne LH z `desk/.env.example`. Pusta allowlista oznacza brak dostępu.
4. Lokalnie i w CI sprawdź `npm install`, `npm run typecheck`, `npm run build`. Testuj anonimowego, dopuszczonego i niedopuszczonego użytkownika, brak dostępu do kluczy, ręczny zapis, rewizje i konflikt 409.
5. Dopiero po podpisaniu testów uruchom zapis; do tego czasu `AM_RADAR_EDITOR_WRITE_ENABLED=0`. Hosting Vercel może mieć odrębne limity i opłaty, ale Auth.js/GitHub OAuth nie wymaga abonamentu.

## Kryteria odbioru

- Brak sesji lub GitHub ID poza allowlistą = brak danych i brak zapisu.
- Oddzielne tokeny LH dla read i write; brak sekretów w przeglądarce.
- Bez automatycznej publikacji, bez modyfikowania stron i Crona.
