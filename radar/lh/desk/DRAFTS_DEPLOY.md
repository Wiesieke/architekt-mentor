# ArchitectMentor Desk — Szkice artykułów (v0.4, LH.pl)

## Co powstaje

Dodatkowa zakładka **Szkice artykułów** w działającym prywatnym panelu na
\`https://mentor-api.sensinte.com/architect-desk/\`.

Przebieg: **Radar → utwórz szkic → skopiuj brief do ChatGPT → wklej autorski tekst
do panelu → zapisz → przekaż do akceptacji → potwierdź ręcznie.**

- Nie ma automatycznego tworzenia treści ani API AI. ChatGPT działa w obecnej
  sesji/abonamencie użytkownika; treść jest ręcznie przenoszona do panelu.
- Nie ma endpointu WordPress, przycisku „Publikuj”, harmonogramu ani Crona
  publikacyjnego.
- Status **APPROVED** oznacza wewnętrzną akceptację, NIE opublikowanie.
- Każda zmiana tekstu po przekazaniu do oceny wraca do **DRAFT**.
- Zatwierdzony szkic jest zablokowany. „Wznów edycję” jawnie cofa akceptację.
- Każdy zapis, przekazanie, zatwierdzenie i cofnięcie pozostawia rewizję
  w \`amr_article_draft_audit\`.

## Kolejność wdrożenia (ważna)

### 1. Kopia bezpieczeństwa i weryfikacja bazy

W phpMyAdmin wykonaj pełny **Eksport** bazy ArchitectMentor (SQL).
Nie pracuj na bazie WRYCUT ani na bazie strony publicznej.

W zakładce SQL wykonaj:

\`\`\`sql
SELECT DATABASE();
SHOW TABLES LIKE 'amr_article_drafts';
SHOW TABLES LIKE 'amr_article_draft_audit';
\`\`\`

Wynik \`SELECT DATABASE()\` MUSI być \`serwer428682_architectradar\`.
Obydwa \`SHOW TABLES\` przed migracją powinny zwrócić **0 wierszy**.

Jeśli któraś tabela istnieje albo kopia nie została wykonana — STOP, nie
uruchamiaj migracji ponownie.

### 2. Migracja SQL 004 (jednorazowa)

W tej samej, zweryfikowanej bazie wykonaj cały plik:

\`radar/db/004_architectmentor_article_drafts.sql\`

Sprawdź ponownie oba \`SHOW TABLES\`: każdy powinien zwrócić **1 tabelę**.
Następnie wykonaj:

\`\`\`sql
SELECT COUNT(*) AS drafts_count FROM amr_article_drafts;
SELECT COUNT(*) AS audit_count FROM amr_article_draft_audit;
\`\`\`

Przy pierwszym uruchomieniu oba liczniki powinny wynosić **0**.

### 3. FileZilla — dopiero po udanej migracji

Ze sprawdzonej gałęzi \`feature/architectmentor-article-drafts-20261028\`
weź pliki z \`radar/lh/desk/\` i wgraj do:

\`/public_html/mentor-api.sensinte.com/architect-desk/\`

| Plik | Działanie |
| --- | --- |
| \`index.php\` | Nadpisz |
| \`app.js\` | Nadpisz |
| \`app.css\` | Nadpisz |
| \`drafts.js\` | Nowy |
| \`drafts-api.php\` | Nowy |

**Nie usuwaj ani nie nadpisuj** \`.vault/\`, \`auth.php\`, \`totp.php\`,
\`desk-db.php\`, \`.htaccess\`, \`api.php\` oraz istniejącego Crona.
Nie przesyłaj migracji SQL, katalogów \`tests/\` ani README do katalogu WWW.

### 4. Test prywatności i działania

1. W oknie incognito bez logowania otwórz:
   \`https://mentor-api.sensinte.com/architect-desk/drafts-api.php?action=list\`.
   Wymagane **401** z \`login_required\` (nie lista szkiców).
2. Potwierdź, że \`/.vault/config.private.php\` i \`/.vault/architect-desk-auth.json\`
   nadal zwracają **403 Forbidden**. Nie wpisuj ich zawartości nigdzie.
3. Zaloguj się do panelu (hasło + Microsoft Authenticator), odśwież Ctrl+F5.
4. Zakładka **Radar decyzji** powinna nadal wyświetlać istniejące materiały.
5. Wybierz materiał, kliknij **Utwórz szkic artykułu**. Zakładka szkiców
   pokaże tytuł materiału oraz link źródłowy.
6. Kliknij **Kopiuj brief do ChatGPT**, wklej w czacie, a własny szkic
   przenieś do pól **Tytuł / Lead / Treść**.
7. **Zapisz szkic** — powinien mieć status DRAFT.
8. **Przekaż do akceptacji** — wymaga leadu min. 40 znaków, treści min.
   150 znaków i poprawnego linku HTTPS; status IN_REVIEW.
9. Zaznacz **trzy osobne potwierdzenia** i kliknij **Zatwierdź ręcznie**.
   Status APPROVED. Potwierdź, że strona publiczna się nie zmieniła.
10. Sprawdź w phpMyAdmin:

\`\`\`sql
SELECT draft_id, status, revision, approved_at_utc
FROM amr_article_drafts ORDER BY draft_id DESC LIMIT 5;
SELECT draft_id, revision, action_label, saved_at_utc
FROM amr_article_draft_audit ORDER BY audit_id DESC LIMIT 10;
\`\`\`

Zapisane działania powinny mieć rosnące rewizje.

### Kiedy przerwać

Jeśli pojawi się błąd 403, brak odczytu, brak migracji, wyjątek PHP
lub którykolwiek plik w \`.vault/\` przestanie zwracać 403, **przerwij
wdrożenie i zgłoś wynik**. Nie wyłączaj ochrony Apache, CSRF ani TOTP.

## Granice tego etapu

Wpisy w Radarze mają status faktów często \`unverified\`. Akceptacja
redakcyjna nie zamienia ich automatycznie w zweryfikowaną informację.
To redaktor sprawdza wiarygodność, prawa, datę i źródło. W przyszłości
można oddzielnie zaprojektować eksport do ręcznego opublikowania, po
dodatkowej autoryzacji. W tej wersji eksportu i publikacji celowo nie ma.
