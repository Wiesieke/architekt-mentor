# Wyłączenie nie cofa skutków

Kandydat ArchitectMentor Weekly. Warsztat redakcyjny, nie opublikowany numer. Stan na 25 października 2026. Ostateczna data wydania nie została ustalona.

## Od redakcji

Przycisk „Wyłącz” wygląda uspokajająco. W końcu jest prosty, wyraźny i ktoś go przetestował. Tylko co właściwie wyłącza: nowe żądania, pracowników kolejki, zapis do bazy czy naszą skłonność do zadawania dalszych pytań?

W tym warsztacie rozdzielamy trzy rzeczy: zatrzymanie nowej pracy, dokończenie pracy rozpoczętej oraz naprawienie jej skutków. To nie są trzy nazwy jednego rollbacku. Każda potrzebuje własnego kryterium powodzenia. Celem numeru jest przejście od deklaracji „możemy wrócić” do procedury, która określa, co stanie się z każdą grupą operacji.

## Wybór z tygodnia: dwie lektury i jedno pogłębienie

1. [Feature flag to nie plan wycofania zmiany](/podstawy-architektury/flagi-funkcji-kontrakt-operacyjny/) — materiał z 24 października. Zacznij od właściciela, zakresu i zachowania awaryjnego. Nie powtarzamy jego sześciopolowego kontraktu; nowa łamigłówka sprawdza go przy niezgodności danych.
2. [Log nie jest audytem](/podstawy-architektury/audyt-zdarzen-biznesowych/) — materiał z 21 października. Przy wycofaniu zmiany trzeba ustalić nie tylko, kto nacisnął przycisk, lecz także które operacje rzeczywiście wykonano. Ten tekst pomaga dobrać dowód.
3. Nowe ćwiczenie i warsztat poniżej — artefaktem końcowym jest macierz zgodności, decyzja ADR i plan próby. To rozwinięcie, nie ponowna publikacja poprzednich tekstów.

Weekly „Zielony nie znaczy zakończony” z 19 października pozostaje bez zmian. Nie jest nowym numerem ani częścią licznika nowych materiałów.

## Łamigłówka architekta: feature flag wyłączona. Co z kolejką?

Fikcyjny scenariusz edukacyjny. Nie opisuje rzeczywistej organizacji, awarii ani doświadczenia autora. Poziom średni; cel: dobrać zakres wycofania zmiany do zgodności kodu, danych i zadań w toku.

Portal przyjmuje wnioski. Nowy wariant zapisuje dodatkowy stan `awaiting-check` i dodaje zadanie do kolejki. Stary worker tego stanu nie rozumie. Nowy worker obsługuje oba formaty. Dotychczasowe pole danych nie zostało usunięte, ale nie każdy nowy rekord da się obsłużyć starą logiką. Nie ma potwierdzonego błędu nowego workera; zgłoszenia dotyczą wyników nowej ścieżki przyjmowania wniosków. Nie wiadomo jeszcze, czy wszystkie te wyniki są niepoprawne. Trzeba zatrzymać nowe wejścia na tę ścieżkę, zachowując możliwość ręcznej obsługi. Założenie ćwiczenia: legalne terminy obsługi pozwalają na krótkie wstrzymanie części wniosków do weryfikacji, a identyfikator wniosku umożliwia powiązanie danych i zadania.

### Szybka decyzja — wybierz jedną z trzech możliwości

A. Wyłącz nową ścieżkę i natychmiast przywróć poprzednią wersję aplikacji oraz workera. To zmniejsza liczbę nowego kodu w systemie, ale wymaga dowodu, że poprzednia wersja odczyta nowe stany i zadania.

B. Wyłącz nową ścieżkę dla kolejnych wniosków, pozostaw zgodny worker i osobno wydziel już rozpoczętą pracę do sprawdzenia. Ogranicza to dalszą ekspozycję, ale wymaga ewidencji stanów i może wydłużyć obsługę części wniosków.

C. Wstrzymaj wszystkie nowe wnioski i przetwarzanie do zakończenia uzgodnienia danych. Upraszcza kontrolę podczas incydentu, ale zatrzymuje też bezpieczny wariant ręczny. Jest uzasadnione, jeśli nie potrafimy wiarygodnie rozdzielić dotkniętych operacji lub nie znamy zasięgu błędu.

### Wyjaśnienie każdego wariantu

W podanych warunkach punktem wyjścia jest B. Mamy zgodny worker i możliwość rozdzielenia wniosków, więc pełne zatrzymanie nie jest jeszcze konieczne. Nie oznacza to automatycznego puszczenia całej kolejki dalej: operacje nowego wariantu należy zidentyfikować i, tam gdzie wynik jest niepewny, wstrzymać do oceny.

A może być dobrym planem po wcześniejszym zapewnieniu zgodności wstecznej albo migracji do stanu obsługiwanego przez starą wersję. W tym scenariuszu taka zgodność nie istnieje. Cofnięcie binariów nie zmieni jej w fakt.

C jest rozsądnym środkiem ograniczającym szkody, gdy nie ma pewnej granicy dotkniętego zakresu. Tu ma większy koszt niż B. Jeśli założenie o rozdzieleniu wniosków okaże się fałszywe, należy wrócić do C. Dobra decyzja ma warunek zmiany, nie immunitet na nowe fakty.

### Warsztat z mentorem

W dwóch–trzech zdaniach opisz: co zatrzymujesz, jaki kod pozostawiasz i jak ustalisz los rozpoczętych operacji. Pytanie naprowadzające: „Czy poprzednia wersja potrafi odczytać każdy stan, który istnieje już w danych lub kolejce?”

Trzy kryteria, każde po 0–2 punkty; razem 6:

| Kryterium | 0 punktów | 1 punkt | 2 punkty |
| --- | --- | --- | --- |
| Zgodność | Utożsamia wyłączenie z rollbackiem | Wspomina o danych | Uwzględnia nieobsługiwany stan oraz format pracy w kolejce |
| Ograniczenie szkód | Kontynuuje bez kontroli | Zatrzymuje pracę bez rozróżnienia | Oddziela nowe wejścia, zgodny worker i niepewną pracę |
| Dowód | Nie proponuje sprawdzenia | Proponuje ogólny monitoring | Wskazuje próbę ze stanem nowego wariantu i uzgodnienie losu zadań |

Mentor ocenia uzasadnienie, nie literę odpowiedzi. Rozsądnie uzasadnione C nie otrzymuje kary za sam wybór. Odpowiedź A nie może dostać pełnych punktów bez rozwiązania jawnej niezgodności. To gotowy projekt feedbacku; w tym podglądzie nie ma połączenia z API mentora ani automatycznej oceny.

### Analiza seniora i przykładowy ADR

Najpierw zatrzymaj dalszą ekspozycję i zachowaj dowody. Potem wylicz wnioski przyjęte nową ścieżką, ich stan, wersję zadania i potwierdzone skutki. Nie odtwarzaj całej kolejki od początku: ponowne wykonanie może powtórzyć skutek biznesowy. Zdecyduj osobno o wznowieniu, ręcznym rozstrzygnięciu lub kompensacji każdego rodzaju stanu. Nie obiecuj automatycznej kompensacji, jeśli reguły biznesowe jej nie dopuszczają.

ADR — status proponowany. Kontekst: stary worker nie rozumie już istniejącego stanu; nowy jest zgodny z oboma formatami. Decyzja: ograniczamy nowe wejścia feature flag, zachowujemy zgodne przetwarzanie i izolujemy niepewny zakres. Konsekwencje: przez okres naprawy utrzymujemy nowy kod oraz ewidencję rozpoczętych operacji. Warunek zmiany: brak możliwości rozdzielenia zakresu lub ryzyko wspólnego mechanizmu wymaga pełnej pauzy. Weryfikacja: próba z rekordem nowego typu, opóźnionym zadaniem i ponowieniem bez zdublowania skutku. To propozycja do zatwierdzenia w modelowym projekcie, nie decyzja wdrożona przez autora.

## Warsztat 40 minut: trzy plany zamiast jednego rollbacku

Pracujcie na tej samej fikcyjnej sytuacji. Przygotujcie jeden arkusz, nie pięć prezentacji. Wynikiem ma być procedura, którą da się wykonać bez domyślania się intencji autora.

### 1. Granica i macierz zgodności — 10 minut

Wypisz cztery zasoby: żądania wejściowe, rekordy, zadania i skutki zewnętrzne. Dla każdego zapisz wersję producenta i konsumenta, źródło identyfikatora i zachowanie przy nieznanym formacie. Test ma wykazać zgodność, nie tylko brak błędu deserializacji. Poprawnie odczytany stan może nadal zostać błędnie zinterpretowany.

### 2. Trzy niezależne działania — 10 minut

Pierwszy plan zatrzymuje nowe wejścia na ryzykowną ścieżkę. Drugi określa, co wolno dokończyć: zachowany worker, selektywna pauza i lista przypadków wymagających decyzji. Trzeci naprawia skutki: korekta, wznowienie lub kompensacja, ale tylko na zasadach procesu. Właściciel usługi określa dopuszczalny wynik biznesowy; operator nie powinien go zgadywać z nazwy kolumny.

### 3. Próba przy granicy przełączenia — 15 minut

Uruchom w izolowanym środowisku scenariusz z pracą rozpoczętą przed zmianą oraz po niej. Zatrzymaj dostarczanie konfiguracji do jednej instancji, opóźnij komunikat, a następnie powtórz jego dostarczenie. Sprawdź nie tylko wartość feature flag, ale wariant faktycznie wykonany i końcowy stan wniosku. Dobierz limity czasu do wymagań projektu; nie przenoś arbitralnej liczby z ćwiczenia do produkcji.

Dowodem jest zestaw identyfikatorów testowych z oczekiwanym i rzeczywistym stanem oraz wykaz rozbieżności. Brak pomiaru nie oznacza zera błędów. Nie używaj rzeczywistych danych klientów do udowadniania, że „to tylko test”.

### 4. Próg decyzji — 5 minut

Zapisz, kto ma prawo zatrzymać usługę, kto potwierdza zgodność danych oraz jaki wynik próby blokuje wydanie. Usuń stare ścieżki dopiero po zakończeniu okresu zgodności i sprawdzeniu zaległej pracy. Feature flag jest elementem sterowania. Nie jest wehikułem czasu dla bazy danych.

## Architektura w ruchu — selekcja, nie wypełniacz

Microsoft wymienia event-driven cache updates jako nowy materiał Architecture Center w październiku 2026. To publikacja guidance, nie ogłoszenie GA ani Preview nowej usługi. Nie udało się potwierdzić dokładnego dnia publikacji; temat pozostaje w radarze, nie jest gotowym newsem tego numeru. Przyszła analiza powinna zbadać ryzyko ponownego zapisania starej wartości po aktualizacji cache. Test: opóźniony odczyt starej wersji kończy się po zapisie nowszej; starszy wynik nie może jej zastąpić.

Lockfiles GitHub Actions były już w Weekly 19.10 — nie dodajemy tego ponownie jako nowości. Lambda Web Functions ma ogłoszenie z 12.10; sam fakt istnienia ogłoszenia nie wystarcza do rekomendacji migracji. Nie twierdzimy, że w świecie IT brak nowych wydarzeń: ta sekcja nie przeszła jeszcze pełnej selekcji i QA.

## Źródła i granice

Sprawdzone 25.10.2026: [OpenFeature — ocena flag](https://openfeature.dev/specification/sections/flag-evaluation/), [zdarzenia dostawcy](https://openfeature.dev/specification/sections/events/), [Unleash — spójność oceny](https://docs.getunleash.io/guides/best-practices-using-feature-flags-at-scale), [Azure Architecture Center — changelog](https://learn.microsoft.com/en-us/azure/architecture/changelog). Specyfikacja nie zapewnia cofania danych ani biznesowej kompensacji. Scenariusz, macierz, ADR i plan próby są autorską syntezą edukacyjną, nie relacją z wdrożenia. Nie wykonano opisanej próby ani wywołania AI.
