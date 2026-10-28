# ArchitectMentor Desk v0.5 — podgląd i ręczny eksport (LH.pl)

## Zakres

- Podgląd zapisanej lub edytowanej treści: tytuł, lead, akapity, nagłówki i listy.
- Metryka redakcyjna: źródło, status faktów z Radaru, numer wersji, osoba oraz data ręcznej akceptacji.
- Po zatwierdzeniu: **Pobierz HTML**, **Pobierz MD** oraz **Kopiuj HTML**.
- HTML jest tworzony z bezpiecznych węzłów DOM; surowy HTML w treści nie jest wykonywany.
- Eksport zawiera artykuł i link źródłowy, **nie zawiera wewnętrznego loginu redaktora**.
- **Nie ma publikacji**, integracji z WordPressem, dodatkowego AI API ani nowego Crona.
- **Nie ma żadnej migracji bazy danych** w tej wersji.

## Wdrożenie przez FileZilla

Warunek: działa wersja v0.4 z migracją 004, dostępem przez TOTP oraz zapisanym artykułem.

1. Zachowaj kopie obecnych plików `drafts.js` i `app.css` z serwera.
2. Z gałęzi `feature/architectmentor-draft-preview-export-20261028`, folder `radar/lh/desk`, wybierz **wyłącznie**:
   - `drafts.js` — nadpisz;
   - `app.css` — nadpisz.
3. Wgraj je przez FileZilla do:
   `/public_html/mentor-api.sensinte.com/architect-desk/`.
4. Nie wgrywaj plików `tests/`, instrukcji Markdown ani migracji. Nie zmieniaj `.vault/`, `.htaccess`, `auth.php`, `api.php`, `drafts-api.php`, konfiguracji ani tabel.
5. Po zalogowaniu naciśnij **Ctrl+F5**.

## Test funkcjonalny bez publikacji

1. W zakładce **Szkice artykułów** otwórz tekst o statusie **Zatwierdzony · nieopublikowany**.
2. Sprawdź metrykę: tytuł, źródło, `fact_check_status`, zatwierdzający i czas UTC.
3. Kliknij **Podgląd artykułu**. Nagłówki z Markdown powinny być nagłówkami, a listy listami.
4. Kliknij **Pobierz HTML** i **Pobierz MD**. Sprawdź, czy obydwa pliki pojawiły się w Pobranych.
5. Otwórz plik HTML w przeglądarce lub edytorze. Powinien zawierać artykuł, ale żadnych skryptów ani prywatnego loginu.
6. Kliknij **Kopiuj HTML** i wklej wynik do lokalnego edytora tekstu. To nie jest publikacja.
7. Otwórz niezatwierdzony szkic. Przyciski eksportu powinny być niedostępne; podgląd nadal działa.
8. Sprawdź, że publiczna strona ArchitectMentor i WordPress nie zmieniły się.

## Kontrola bezpieczeństwa

- Bez sesji otwarcie `drafts-api.php?action=list` musi zwrócić 401.
- Pliki `.vault/config.private.php` i `.vault/architect-desk-auth.json` muszą nadal zwracać 403.
- `APPROVED` pozostaje statusem wewnętrznym. `fact_check_status=unverified` nie jest zmieniany automatycznie.
- HTML/Markdown to **ręczne pliki eksportowe**, a nie automatyczna publikacja.

## Cofnięcie tej wersji

W razie problemów przywróć jedynie poprzednie `drafts.js` i `app.css` z działającej gałęzi `feature/architectmentor-article-drafts-20261028`. Nie przywracaj bazy: ta wersja nie zmienia schematu ani danych.
