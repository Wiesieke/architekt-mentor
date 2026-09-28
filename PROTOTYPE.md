# Prototyp magazynu ArchitectMentor w Astro

Ta gałąź pokazuje stronę główną (`/`), łamigłówkę (`/lamiglowka/`), archiwa obu działów i pięć artykułów na własnych adresach (cztery z „Architektury w ruchu”, jeden z „Podstaw”). Jest przeznaczona do podglądu. Nie scalać jej do `main`: kompilacja Astro zastąpiłaby obecne strony, które nie zostały jeszcze przeniesione.

## Sprawdzenie lokalne

```sh
npm ci
npm run build
npm run dev
```

Łamigłówka jest wybierana z istniejącego `data/puzzles.json`. Analiza seniora działa bez AI; przycisk oceny korzysta z istniejącego endpointu `/api/evaluate-puzzle`, jeśli jest dostępny na wdrożeniu podglądowym. Zapis odpowiedzi pozostaje wyłączony, dopóki użytkownik nie zaznaczy pola.

Pozostałe sekcje prowadzą do aktualnej produkcyjnej witryny. Przed migracją całości trzeba przenieść pozostałe treści i istniejące funkcje `/api`, stronę o danych, stronę oferty, antywzorce, generator HLD i kontakt. Zachowaj stare adresy lub przekieruj je na odpowiedniki; stare fragmenty `#postgresql-19-beta4` itp. nie są przesyłane serwerowi, więc samym przekierowaniem HTTP nie da się skierować każdej kotwicy na osobny artykuł. Można pozostawić stary przewodnik z odsyłaczami do nowych stron. W prototypie ustawiono `noindex,nofollow`.

## Magazyn: publikacje, języki i widoczność

- Sekcja „Nowe w magazynie” czyta `src/data/editions.ts`. Podczas cotygodniowej publikacji dodaj wpisy z rzeczywistą datą opublikowania materiału (`published`), adresem i krótkim opisem. `eventDate` to osobna data wydarzenia opisywanego w artykule. Tytuł sekcji pochodzi z daty najnowszego wpisu i nie udaje bieżącego tygodnia, gdy publikacja się opóźni. Docelowo ten indeks powinien powstawać z jednego źródła treści dla wszystkich stron, zamiast ręcznego przepisywania tytułów.
- Szablon ma opis strony, tytuł, metadane społecznościowe i daty. Pięć artykułów ma własne adresy, opis i dane strukturalne `Article` (data publikacji tylko gdy jest znana). `src/pages/sitemap.xml.ts` wylicza adresy prototypu, a `src/pages/robots.txt.ts` wskazuje mapę wyłącznie przy włączonej indeksacji. Dopiero po migracji wszystkich adresów, sprawdzeniu przekierowań, kompletności mapy witryny i Search Console ustaw `PUBLIC_SITE_INDEXABLE=true` w produkcji. Wtedy pojawia się kanoniczny adres `https://ejsymont.com/...` i znika `noindex`. Na podglądach zostaw indeksowanie wyłączone.
- `Studio.astro` przyjmuje `locale: 'pl' | 'en'` i centralizuje teksty wspólnej nawigacji. Angielskie materiały powinny mieć osobne adresy `/en/...` i pełne tłumaczenia nagłówków, treści, opisów oraz formularzy. Dodaj przełącznik PL/EN i wzajemne `hreflang` dopiero wtedy, gdy obie wersje konkretnej strony istnieją. Obecnie dostępna jest tylko wersja polska; samo ustawienie `locale` nie tłumaczy treści.
- `SponsorSlot.astro` wyznacza miejsce dla sponsorowanej treści. Bez sponsora nie renderuje żadnej reklamy ani pustego prostokąta; po podaniu danych jawnie oznacza reklamę i link jako `sponsored`. Integrację AdSense należy dodać dopiero po przygotowaniu zasad prywatności i mechanizmu zgody na odpowiednie technologie. Reklama nie może zasłaniać ćwiczenia ani naśladować treści redakcyjnych.
- `src/data/articles.ts` zbiera metadane artykułów; ich treść przeniesiono bez zmian z istniejących plików HTML do `src/content/articles/*.html`. Pierwsza partia to cztery artykuły „W ruchu” oraz bulkhead. Reszta przewodnika „Podstawy” wciąż jest pod dotychczasowym adresem. Aktualizuj indeks artykułów i sekcję tygodnia przy każdym wydaniu; nie przypisuj daty wydarzenia technologicznego jako daty publikacji w portalu.
