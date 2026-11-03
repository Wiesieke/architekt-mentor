# ArchitectMentor — przejście na automatyczną publikację po zatwierdzeniu w Desk

## Reguła
Publikacja wymaga **dwóch osobnych, świadomych czynności w Desk**: zatwierdzenia konkretnej rewizji PL i EN oraz zlecenia publikacji. Samo zapisanie szkicu nie publikuje. Po tych dwóch decyzjach GitHub Actions sam tworzy PR, wykonuje lokalny build, sprawdza kontrolę redakcyjną, jakość obu wersji, Vercel Protected Preview i potwierdzenie tej samej niezmiennej rewizji. Następnie sprawdza SHA głowy PR, wykonuje squash merge **bez `--admin`** i dopiero po weryfikacji stron PL/EN, RSS i sitemap zgłasza `PUBLISHED`.

## Aktywacja
1. Zweryfikować, że `AM_RELEASE_ENABLED=1`, sekret wydawniczy i aktualne testy oraz protected Preview są zielone.
2. Scalić zabezpieczenie `feat/auto-release-safe-switch-20261103` do `main` (wcześniej zatwierdzić CI).
3. W GitHub `Wiesieke/architekt-mentor → Settings → Secrets and variables → Actions → Variables` zmienić zmienną **`AM_RELEASE_AUTO_MERGE` z `0` na `1`**.
4. Nowe zlecenie wydania z Desk automatycznie uruchamia worker przez `workflow_dispatch` i przechodzi pełną ścieżkę publikacji. Harmonogram 15 minut jest zapasowy.
5. Sprawdzić nowy materiał od `QUEUED` do `PUBLISHED`, w tym PL/EN, autorstwo/redakcję i linki.

## Zaległa kolejka
Stare zadania `PR_READY` z okresu ręcznego zatwierdzania NIE są podejmowane automatycznie przez nowy worker, nawet po zmianie flagi. Dla tych PR pozostaje indywidualny ręczny przegląd i merge, lub świadome wycofanie w Desk; zmiana ustawienia nie jest masową zgodą na publikację zaległych szkiców.

PR #91 / rewizja 17 to ostatnie wydanie przygotowane jeszcze w trybie ręcznym. Jego stan trzeba uzgodnić i rozstrzygnąć odrębnie; zmiana przełącznika nie nadaje mu automatycznie nowej zgody i nie aktualizuje jego statusu w Desk.

## Wyłączenie awaryjne
Ustawić zmienną `AM_RELEASE_AUTO_MERGE=0`. Od tej pory nowe zadania po kontroli kończą na `PR_READY`. Jeśli potrzebne wstrzymanie tworzenia nowych PR, ustawić osobno `AM_RELEASE_ENABLED=0`; nie kasować zatwierdzeń ani kolejki.

## Ochrona
- Zakaz merge `--admin`; respektowane aktualne reguły repozytorium (nie można było odczytać ustawień gałęzi przez podłączoną integrację; administrator powinien je dodatkowo zweryfikować).
- `gh pr merge --match-head-commit <SHA>` nie scali wersji innej niż ta, która przeszła testy.
- Po `merge` worker nie może zgłosić fałszywego błędu „nieopublikowano”; `VERIFY_PENDING` zachowuje SHA i powoduje ponowną weryfikację stron.
- Automatyzacja nie dopisuje autorstwa; podpis pochodzi wyłącznie z zatwierdzonej rewizji Desk.

## Istotne ograniczenie
Konfiguracja Actions Variables jest w GitHub repozytorium, nie w plikach kodu. Zmiana kodu nie zmienia automatycznie wartości tej zmiennej; potrzebne są uprawnienia administratora do jej edycji.
