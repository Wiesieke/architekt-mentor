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
