# Prototyp portalu w Astro

Ta gałąź pokazuje nową stronę główną (`/`) i widok jednej łamigłówki (`/lamiglowka/`). Jest przeznaczona wyłącznie do podglądu. Nie scalać jej do `main`: kompilacja Astro zastąpiłaby obecne strony, które nie zostały jeszcze przeniesione.

## Sprawdzenie lokalne

```sh
npm ci
npm run build
npm run dev
```

Łamigłówka jest wybierana z istniejącego `data/puzzles.json`. Analiza seniora działa bez AI; przycisk oceny korzysta z istniejącego endpointu `/api/evaluate-puzzle`, jeśli jest dostępny na wdrożeniu podglądowym. Zapis odpowiedzi pozostaje wyłączony, dopóki użytkownik nie zaznaczy pola.

Odnośniki do innych sekcji prowadzą do aktualnej produkcyjnej witryny. Przed migracją całości trzeba przenieść te sekcje, istniejące funkcje `/api`, stronę o danych, stronę oferty i zachować przekierowania dla dotychczasowych adresów. W prototypie ustawiono `noindex,nofollow`.

## Magazyn: publikacje, języki i widoczność

- Sekcja „Nowe w magazynie” czyta `src/data/editions.ts`. Podczas cotygodniowej publikacji dodaj wpisy z rzeczywistą datą opublikowania materiału (`published`), adresem i krótkim opisem. `eventDate` to osobna data wydarzenia opisywanego w artykule. Tytuł sekcji pochodzi z daty najnowszego wpisu i nie udaje bieżącego tygodnia, gdy publikacja się opóźni. Docelowo ten indeks powinien powstawać z jednego źródła treści dla wszystkich stron, zamiast ręcznego przepisywania tytułów.
- Szablon ma opis strony, tytuł, metadane społecznościowe i daty. Dopiero po migracji wszystkich adresów, sprawdzeniu przekierowań, mapy witryny i Search Console ustaw `PUBLIC_SITE_INDEXABLE=true` w produkcji. Wtedy pojawia się kanoniczny adres `https://ejsymont.com/...` i znika `noindex`. Na podglądach zostaw indeksowanie wyłączone.
- `Studio.astro` przyjmuje `locale: 'pl' | 'en'` i centralizuje teksty wspólnej nawigacji. Angielskie materiały powinny mieć osobne adresy `/en/...` i pełne tłumaczenia nagłówków, treści, opisów oraz formularzy. Dodaj przełącznik PL/EN i wzajemne `hreflang` dopiero wtedy, gdy obie wersje konkretnej strony istnieją. Obecnie dostępna jest tylko wersja polska; samo ustawienie `locale` nie tłumaczy treści.
- `SponsorSlot.astro` wyznacza miejsce dla sponsorowanej treści. Bez sponsora nie renderuje żadnej reklamy ani pustego prostokąta; po podaniu danych jawnie oznacza reklamę i link jako `sponsored`. Integrację AdSense należy dodać dopiero po przygotowaniu zasad prywatności i mechanizmu zgody na odpowiednie technologie. Reklama nie może zasłaniać ćwiczenia ani naśladować treści redakcyjnych.
- Zachowaj osobne adresy i strony dla artykułów zamiast samych kotwic w zbiorczych plikach. Podczas migracji ustaw przekierowania ze starych adresów, unikalne tytuły i opisy, daty publikacji/aktualizacji, źródła i wewnętrzne linki. Dopiero na prawdziwych stronach artykułów dodaj dane strukturalne `Article` oraz mapę witryny zawierającą tylko indeksowane adresy.
