# ArchitectMentor — migracja awaryjna na Cloudflare Pages (2026-11-15)

## Cel i zakres
Przywrócić czytelnikom publiczne, zatwierdzone materiały PL/EN pod ejsymont.com bez uzależnienia wyświetlania stron od funkcji CPU Vercel. To jest etap 1: strony statyczne, bez udawania działania generatora HLD, oceniania łamigłówek, formularzy ani komentarzy.
Zmiany przygotowano wyłącznie na gałęzi ops/cloudflare-pages-migration-20261115; NIE publikują, NIE zmieniają DNS, NIE zmieniają main ani zatwierdzeń redakcyjnych.

## Potwierdzony stan źródła
- Repozytorium strony: Wiesieke/architekt-mentor, Astro 7, output=static, npm run build, wynik dist/.
- Własna domena ejsymont.com: zarejestrowana przez Vercel, obecnie NS ns1.vercel-dns.com i ns2.vercel-dns.com; rejestracja i odnowienie NIE wymagają przeniesienia.
- Główna wersja produkcyjna w chwili przygotowania: commit 88f8b9afb632af30991c99758d03a5874f0cfd60.
- Funkcje w katalogu api/ są implementacjami Vercel (Node) i nie działają automatycznie w Cloudflare Pages.
- Wykonany audyt Vercel DNS: 6 rekordów, w tym Google TXT, CAA oraz ALIAS do Vercel. Tuż przed zmianą NS pobierz świeżą, kompletną kopię DNS; nie zakładaj, że stan pozostał ten sam.

## Krok 1 — utworzenie środowiska testowego
1. W Cloudflare utwórz Pages > Connect to Git. Autoryzuj repo Wiesieke/architekt-mentor.
2. Pierwsza próba: wybierz gałąź ops/cloudflare-pages-migration-20261115 jako Production branch, aby nie ingerować w main. Nazwa projektu przykładowa: architectmentor-stage.
3. Framework preset Astro; Root directory /; Build command: npm ci && npm run build && node scripts/cloudflare-static-preflight.mjs; Build output: dist.
4. Ustaw NODE_VERSION=24 i PUBLIC_SITE_INDEXABLE=false. Nie kopiuj żadnych kluczy API do zmiennych publicznych.
5. Wdróż na adres *.pages.dev. Sprawdź minimum: /, /pl/, /en/, artykuły PL/EN, archiwum, ćwiczenia statyczne, sitemap.xml, robots, stare aliasy oraz poprawne 404.
6. Zweryfikuj, że /api/generate oraz /api/comments zwracają jawne HTTP 503 z JSON, a nie HTML 200. To tymczasowa blokada niewdrożonego API.

## Krok 2 — pełna gotowość do przełączenia domeny
1. Nie obiecuj działania formularzy, komentarzy ani generatora HLD na samym hostingu statycznym. Opcja awaryjna: przywróć najpierw czytanie artykułów i wyświetl komunikat o czasowej niedostępności interakcji. Pełna migracja wymaga portowania API, testów integracyjnych, sekretów i zabezpieczeń.
2. Nie uruchamiaj ponownie automatycznej publikacji, jeśli proces CI nadal wymaga udanego Vercel Preview. Opracuj równoważną bramkę jakości na Cloudflare i zachowaj dokładne zatwierdzenie wersji.
3. W GitHub Settings > Secrets and variables > Actions > Variables sprawdź AM_RELEASE_ENABLED. Na czas przełączenia można tymczasowo ustawić 0, aby sam proces publikacji nie próbował scalać zatwierdzonych materiałów. Nie wyłączaj Radarów, researchu i draftów. Nie zmieniaj AM_RELEASE_AUTO_MERGE bez oceny istniejącego procesu.
4. Po testach przeprowadź review gałęzi migracyjnej i scal świadomie do main. Następnie przełącz produkcyjną gałąź Cloudflare na main, potwierdź build i ustaw PUBLIC_SITE_INDEXABLE=true dopiero dla właściwej produkcji.

## Krok 3 — DNS i domena
1. Zapisz świeżą kopię wszystkich rekordów DNS ejsymont.com po stronie Vercel (TXT Google, CAA, ewentualne MX, SPF, DKIM, DMARC, inne rekordy). W obecnym odczycie MX brak, ale sprawdź przed przełączeniem.
2. Dodaj strefę ejsymont.com na Cloudflare (Free) i odtwórz potrzebne rekordy, nie kopiując rekordów ALIAS wskazujących na Vercel jako produkcyjny apex.
3. Podłącz ejsymont.com w Pages > Custom domains, uzyskaj gotowy certyfikat HTTPS. Dla apex Cloudflare Pages wymaga aktywnej strefy DNS na Cloudflare i zmiany nameserverów w panelu rejestratora Vercel.
4. Zmień NS ejsymont.com w panelu domeny Vercel na nazwy wskazane przez Cloudflare, dopiero po gotowości serwisu i strefy DNS. Nie usuwaj domeny z rejestracji Vercel. Nie zakładaj natychmiastowej propagacji.
5. Sprawdź z zewnętrznej sieci: https://ejsymont.com, /pl/, /en/, przykładowy artykuł, adresy aliasów, HTTPS i SEO. Monitoruj przez pierwsze dni.

## Odwrócenie zmiany
Jeżeli Cloudflare lub DNS zawiodą, przywróć poprzednie nameservery Vercel i zweryfikuj rekordy. UWAGA: samo przywrócenie NS nie usunie wcześniejszego komunikatu Vercel, jeśli wdrożenie jest nadal wstrzymane. Trwały rollback wymaga działającego poprzedniego hostingu albo alternatywnego gotowego środowiska.

## Warunki bezpieczeństwa
- Zakaz przełączenia DNS bez udanego testu pod *.pages.dev.
- Zakaz automatycznego publikowania niezatwierdzonych treści lub zmian w main.
- Zakaz przenoszenia sekretów API do przeglądarki, repozytorium lub plików statycznych.
- Funkcje API pozostają oznaczone jako niedostępne, dopóki nie zostaną rzeczywiście zmigrowane i przetestowane.
- Root: /en/ to statyczny odpowiednik fallbacku z Astro; dotychczasowy geolokalizacyjny wybór języka w Vercel nie zostaje przeniesiony w etapie 1. Czytelnik może wybrać /pl/.

## Oficjalne źródła
- https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/pages/functions/routing/
