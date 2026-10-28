# ArchitectMentor Desk — WordPress: ręczne przekazanie jako szkic (v0.6)

## Co robi funkcja
Po **ręcznej akceptacji** artykułu operator może kliknąć „Przekaż do WordPressa jako szkic”.
PHP (po stronie serwera LH.pl) wyśle pojedyncze żądanie WordPress REST API
`POST /wp-json/wp/v2/posts` z **na stałe ustalonym `status: draft`**.
Panel nie ma żadnego kodu publikującego, planującego publikację, edytującego
ani kasującego wpis WordPress. W WordPressie trzeba samodzielnie przeczytać
tekst i nacisnąć **Opublikuj**. Nie potrzeba płatnego AI API.

## Instalacja na hostingu LH.pl (kolejność ma znaczenie)

1. **Backup** bazy ArchitectMentor w phpMyAdmin. Wykonaj osobno:
   `SELECT DATABASE();` — wynik musi być `serwer428682_architectradar`.
2. W phpMyAdmin w tej właśnie bazie uruchom raz
   `radar/db/005_architectmentor_wp_draft_handoffs.sql`.
   Zweryfikuj: `SHOW TABLES LIKE 'amr_wp_draft_handoffs';` — jeden wiersz.
3. W FileZilla prześlij do `/public_html/mentor-api.sensinte.com/architect-desk/`
   dokładnie te pliki z tej samej wersji/gałęzi:
   - `wordpress-draft.php` (NOWY, dostęp przez WWW musi dawać HTTP 403)
   - `wordpress-draft-api.php` (NOWY)
   - `drafts-api.php` (ZMIENIONY)
   - `drafts.js` (ZMIENIONY)
   - `index.php` (ZMIENIONY)
   - `app.css` (ZMIENIONY)
   - `.htaccess` (ZMIENIONY — jeśli był dostosowywany na serwerze, scal reguły)
4. W WordPress utwórz **oddzielnego użytkownika Contributor/Współpracownik**,
   który może tworzyć szkice, ale **nie posiada uprawnienia `publish_posts`**.
   Pod tym kontem: Użytkownicy → Profil → Hasła aplikacji →
   utwórz hasło o nazwie np. `ArchitectMentor Desk draft handoff`.
5. Dane dostępowe zapisz **wyłącznie** w
   `architect-desk/.vault/config.private.php`, w istniejącej tablicy PHP:
   ```php
   'AM_WP_DRAFT_ENABLED' => '1',
   'AM_WP_SITE_URL' => 'https://DOKLADNA-DOMENA-WORDPRESS.PL',
   'AM_WP_USERNAME' => 'LOGIN_OSOBNEGO_KONTA_WP',
   'AM_WP_APPLICATION_PASSWORD' => 'HASLO_APLIKACJI_WORDPRESS',
   ```
   Nie wysyłaj hasła w rozmowie, nie dodawaj go do GitHub i nie zapisuj w JS.
   **Nie nadpisuj** pozostałych danych konfiguracji, w szczególności danych
   bazy i klucza panelu. Upewnij się, że `/.vault/config.private.php`
   nie jest dostępny przez WWW (HTTP 403) i że nowy
   `/architect-desk/wordpress-draft.php` też zwraca HTTP 403.
   W razie wątpliwości pozostaw `AM_WP_DRAFT_ENABLED = '0'`.
6. Wyczyść cache przeglądarki (`Ctrl+F5`), otwórz zatwierdzony artykuł i
   użyj tylko raz przycisku „Przekaż do WordPressa jako szkic”.
   Powinien pojawić się ID utworzonego szkicu i link do jego edycji w WordPress.
   W WordPressie potwierdź status **Szkic**, przed ewentualną publikacją.

## Co sprawdzić przed uruchomieniem

- Dokładny adres strony WordPress musi być znany (bez loginu i tokenów).
  `AM_WP_SITE_URL` to adres instalacji WP; HTTPS jest wymagany.
- Na LH.pl moduł PHP cURL musi być dostępny.
- REST API WordPress i hasła aplikacji muszą być aktywne; wtyczki bezpieczeństwa
  lub konfiguracja hostingu mogą blokować nagłówek Authorization.
- Rozpoczęta próba zapisuje trwały stan `PENDING` przed wywołaniem sieciowym.
  Sukces oznacza `CREATED`. Błąd lub timeout daje `UNKNOWN` (albo `PENDING`,
  jeśli np. serwer przerwał PHP). **W tych stanach nie ponawiaj wysyłki.**
  Najpierw sprawdź listę szkiców bezpośrednio w WordPressie;
  ewentualne ręczne uzgodnienie wykonujemy dopiero po weryfikacji.
- Zmiany w artykule po rozpoczęciu przekazania są blokowane w ArchitectMentor,
  aby kopia zatwierdzona i kopia WordPress się nie rozeszły.
- Wpis WordPress może zostać później opublikowany wyłącznie **ręcznie w WP**.
  Panel nie śledzi późniejszej publikacji i nie aktualizuje tego wpisu.

## Test bezpieczeństwa
- Bez loginu i kodu Authenticatora endpoint musi zwracać 401.
- Bez poprawnego tokenu CSRF POST musi zwracać 403.
- Niezatwierdzony tekst: 409.
- Po wysłaniu drugie wysłanie: 409.
- Status zapisanego wpisu po przekazaniu: **draft**.
- Bez `AM_WP_DRAFT_ENABLED = '1'` wysłanie musi być niedostępne.
