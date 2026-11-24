# Auditor Lab v0.3.1 — instrukcja lokalna

1. W katalogu ArchitectMentor uruchom `npm run dev`. Użyj Node.js 24 i zainstalowanych zależności projektu.
2. Otwórz [Auditor Lab](http://localhost:4321/narzedzia/auditor-lab). Jeśli Astro zgłosi inny port, użyj go zamiast `4321`. Nie uruchamiaj przez publiczny adres, `--host` bez argumentu ani tunel.
3. Zostaw zaznaczoną opcję **Przykład syntetyczny**, wybierz scenariusz i kliknij **Uruchom demo offline**.
4. W raporcie kliknij **Pokaż cytat w HLD** lub **Pokaż cytat w ADR**, aby przejść do wyróżnionego fragmentu źródła. W widoku **Graf powiązań** można wybrać węzeł myszą lub klawiszem Enter. **Pobierz JSON** zapisuje raport w przeglądarce, bez przesyłania go na serwer.

W trybie **Własne dokumenty** wczytasz po jednym HLD i ADR jako TXT lub Markdown w UTF-8. Możesz też wkleić tekst lub usunąć dokument. Laboratorium sprawdza tylko format i długość: od 20 jednostek UTF-16 po przycięciu do 30 000 jednostek w oryginalnym tekście. PDF i DOCX nie są obsługiwane. Własne dokumenty nie opuszczają karty przeglądarki; nie są zapisywane przez aplikację ani przekazywane do audytu. Nie używaj dokumentów firmowych.

## Jak czytać wynik

Demo uruchamia Evidence Model v0.2.2 na syntetycznych źródłach, ręcznie przygotowanych faktach i podpisanych recenzjach testowych. Nie uruchamia AI. Zatwierdzona recenzja testowa nie potwierdza tożsamości człowieka. `PASS` znaczy, że dokumentacja opisuje zabezpieczenie właściwego efektu; nie jest gwarancją, że wdrożenie działa. `NEEDS_REVIEW` oznacza niepełne lub sprzeczne dowody, `FAIL` udokumentowaną niezgodność, a `NOT_APPLICABLE` brak zastosowania reguły. Graf wizualizuje dokumenty, przepływy i twierdzenia, lecz nie służy do wnioskowania.

Zacznij od **Oceny ARCH-001**: pokazuje zakres, przyczynę wyniku i zalecane działanie. Poniżej są osobne sekcje dowodów potwierdzonych, dowodów do weryfikacji i sprzeczności. Gdy raport zawiera odrzucony lub częściowo potwierdzony wymiar, interfejs pokazuje go przy cytacie (np. efekt biznesowy, `effectId`). Jeśli raport nie wskazuje dokładnych twierdzeń będących w konflikcie, interfejs nie zgaduje. W **Szczegółach technicznych** znajdują się oryginalne kody i wynik weryfikacji podpisu, nie sam podpis.

W grafie efekty są rozdzielone według przepływu. Węzły dowodów pokazują istniejące kotwice cytatów. Kropkowana relacja oznacza niepotwierdzone przypisanie, nie fakt. Kliknięcie węzła wyróżnia jego powiązania i cytaty. Widok nie zmienia danych silnika ani zawartości eksportu JSON.

## Izolacja i testy

Strona i endpoint przykładów są rejestrowane wyłącznie w trybie deweloperskim Astro na interfejsie lokalnym, nie w buildzie ani w `astro preview`. Endpoint przyjmuje wyłącznie identyfikator przykładu z zamkniętej listy. Nie odbiera tekstu dokumentów, faktów ani recenzji. Silnik i podpisywanie przykładów działają po stronie lokalnego serwera; klucze testowe są efemeryczne.

```bash
node --test tests/auditor.test.mjs tests/auditor-lab.test.mjs
node scripts/auditor-poc-demo.mjs
```

Żeby sprawdzić build bez aktualizacji `api/_comment-context.json`, uruchom samo `astro build` (np. przez `npx --no-install astro build`, ze wskazaniem tymczasowego `outDir` w konfiguracji inline, jeśli nie chcesz zmieniać `dist`). Sprawdź, czy podgląd produkcyjny zwraca `404` dla `/narzedzia/auditor-lab` i `/narzedzia/auditor-lab/demo.json`.

## Następny etap: rzeczywista ekstrakcja AI

Najpierw podłącz adapter po stronie serwera i zweryfikuj jakość ekstrakcji na niezależnie ocenionych przykładach syntetycznych. Zanim umożliwisz wysłanie własnych dokumentów, ustal zgodę, limity kosztów i rozmiaru, zasady retencji oraz uwierzytelnienie. Ekstraktor ma proponować fakty; zatwierdzanie dowodów musi pozostać niezależne, z rzeczywistą autoryzacją recenzenta. Funkcja serwerowa przygotowana w tej iteracji uruchamia adapter i reguły bez recenzji, nie udostępnia publicznego endpointu i nie odczytuje kluczy.
