# ArchitectMentor — bank kandydatów do Weekly 19 października 2026

Bank służy selekcji i pogłębieniu, nie kopiowaniu pełnych tekstów Daily. Każdy wpis wymaga ponownej weryfikacji przed Weekly.

## 2026-10-13 · Warunkowa decyzja architektoniczna

- Daily PL: /podstawy-architektury/warunkowa-decyzja-architektoniczna/
- Daily EN: /en/foundations/conditional-architecture-approval/
- Status: kandydat do pogłębienia, nie przyjęty automatycznie do Weekly.
- Teza do rozwinięcia: warunkowa akceptacja projektu nie jest zgodą na uruchomienie; właściciel wykonania, weryfikator dowodu i osoba zwalniająca bramkę to potencjalnie różne role.
- Możliwe pogłębienie: interaktywne Practice z trzema wyborami i testem negatywnym; osobny Anti-pattern „Warunki bez właściciela”; model decyzji, gdy wynik próby może unieważnić architekturę.
- Do sprawdzenia: odrębność od podstaw ADR i przeglądu SaaS; brak rozpoznawalnych szczegółów; źródła pierwotne oraz PL/EN; zainteresowanie czytelników.
- Nie przenosić scenariusza do kategorii „rzeczywisty incydent”. Pochodzenie: fikcyjny scenariusz edukacyjny.

## 2026-10-14 · Czy naprawdę potrzebujemy repliki danych?

- Daily PL: /podstawy-architektury/czy-potrzebujemy-repliki-danych/
- Daily EN: /en/foundations/do-we-need-data-replication/
- Status: kandydat do pogłębienia, nie automatyczna publikacja Weekly.
- Teza: sama replika nie gwarantuje HA ani nie zastępuje backupu; kryterium decyzji są mierzalne SLO, świeżość i próba przełączenia.
- Możliwe Practice: wybór wariantu dla trzech różnych RPO/RTO i tolerancji opóźnienia; test awarii, konfliktów oraz read-after-write.
- Pochodzenie: fikcyjny scenariusz edukacyjny; bez powiązania z konkretnym projektem.
