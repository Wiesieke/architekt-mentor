# ArchitectMentor — redakcyjna kolejka Daily / Weekly (25.10.2026)

Status: **warsztat i plan redakcyjny, nie opublikowane materiały, nie automatyczna zgoda na wydanie**. Obowiązuje polityka jakości repo oraz decyzja wydawcy z 25.10 o delegacji publikacji dopiero po pełnej kontroli (PR #65 jest scalony do main, ale egzekwowanie ochrony gałęzi i wszystkie bramki muszą być potwierdzone przed wydaniem).

## Cel

ArchitectMentor jest niezależną marką ekspercko-edukacyjną. Daily ma budować nawyk przez krótkie ćwiczenia decyzyjne, analizy realnych zmian technologicznych i praktyczne poradniki. Weekly ma selekcjonować, pogłębiać i łączyć materiał — nie być automatycznym zrzutem RSS.

Orientacyjny rytm (bez wymuszania wypełniaczy): **4–5 łamigłówek**, **3–5 analiz Architektura w ruchu**, **1–2 dłuższe warsztaty** tygodniowo. Jednego dnia mogą ukazać się dwa sensowne materiały lub żaden, jeśli QA nie przejdzie. Publikacja PL/EN, naturalny język fachowy: np. „feature flag”, gdy sztuczny przekład brzmi nienaturalnie.

## Łamigłówki — kolejka siedmiu scenariuszy

Każdy scenariusz jest fikcyjny i uogólniony; **nie wolno kopiować informacji służbowych, dokumentów, nazw projektów, parametrów, architektur wdrożonych ani danych osób/kontrahentów Totalizatora Sportowego**. Nie przypisywać autorowi fikcyjnych doświadczeń czy wyników. Łamigłówka nie jest testem jednej absolutnej odpowiedzi: trzy wiarygodne opcje, ograniczenia, pytania doprecyzowujące, ryzyka, konsekwencje, analiza mentora i propozycja ADR. EN redagować niezależnie.

| ID | Scenariusz fikcyjny | Kluczowa decyzja | Rozróżnienie/test |
|---|---|---|---|
| P01 | Partner przesyła pliki transakcyjne, które wymagają kalkulacji podatku i prowizji | ESB vs warstwa przetwarzania vs ERP | Odpowiedzialność reguł, odtwarzalność, idempotencja, audyt |
| P02 | Kilka produktów cyfrowych ma współdzielić tożsamość, ale nie wszystkie uprawnienia i środki | Centralny IAM/PAM vs domenowe bounded contexts | Granice danych, SSO, tokeny i separacja wallet |
| P03 | Zespół chce deklarować przenośność aplikacji między chmurami | Abstrakcja platformowa vs usługi zarządzane | Koszt portability, data gravity, próba przeniesienia |
| P04 | Zewnętrzny audytor potrzebuje czasowego dostępu do środowiska badawczego | Bastion/PAM vs VPN + jump host | Least privilege, nagrywanie sesji, egress, revocation |
| P05 | Model segmentacji ma działać na istniejącej platformie danych | Model analityczny vs odrębny system operacyjny | Data ownership, lineage, SLA, odpowiedzialność za wynik |
| P06 | Zespół chce wystawić usługę bezpośrednio do internetu | API gateway vs bezpośredni endpoint | Identity, throttling, monitoring, threat modeling |
| P07 | Wdrożenie jest osłonięte feature flagą | Rollback flagą vs mechanizm odwracania migracji | Stan danych, propagacja flagi, próbny rollback |

### Wymagania dla każdej łamigłówki

- Rzeczywisty problem decyzyjny i przynajmniej dwa uzasadnione warianty; trzy opcje w interaktywnym ćwiczeniu nie powinny być dwiema karykaturami i jednym oczywistym zwycięzcą.
- Feedback mentora ocenia rozumowanie i rozpoznane ograniczenia, nie samą zgodność z odpowiedzią.
- PL/EN, źródła standardów/guidance jeśli zawiera twierdzenia techniczne, oznaczenie fikcji, oryginalność, test interakcji/tras/RSS/sitemap i preview na telefonie.
- Po publikacji monitorować rzeczywiste błędy odpowiedzi i poprawiać z historią zmian, bez wymyślanych statystyk użytkowników.

## „Architektura w ruchu” — radar źródeł pierwotnych

Monitorować dziennie: [Azure Architecture Center changelog](https://learn.microsoft.com/en-us/azure/architecture/changelog), [AWS What's New](https://aws.amazon.com/new/), [GitHub Changelog](https://github.blog/changelog/), oficjalne dokumentacje CNCF/Kubernetes i dostawców, OpenTelemetry, NIST/OWASP, changelogi baz danych i platform danych. Zmiana produktu sama w sobie nie jest materiałem: wymagane istotny wpływ na decyzję architektoniczną i potwierdzone wdrożenie/status/region/ograniczenia.

### Kandydaci do opracowania i ponownej weryfikacji przed publikacją

1. **AWS Lambda Web Functions, 12.10.2026** — https://aws.amazon.com/about-aws/whats-new/2026/10/aws-lambda-web-functions/ . Pytanie: granica HTTP serverless / kontener, lifecycle, streaming, CPU billing, przenośność frameworków. Rozróżnić ogłoszone możliwości i rekomendację autora.
2. **GitHub Actions workflow lockfiles, 14.10.2026** — https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/ . Pytanie: wersjonowanie zależności pipeline, proces aktualizacji lockfile, supply-chain governance. Wyraźnie zaznaczyć Public Preview.
3. **Azure Architecture Center, aktualizacje października 2026** — https://learn.microsoft.com/en-us/azure/architecture/changelog . Wybrać jeden nowy wzorzec: event-driven cache refresh (Redis/Cosmos DB), cache-aside (Redis/PostgreSQL), agentic behavior engineering lub multitenancy with Foundry Models. Najpierw sprawdzić dokładny artykuł i zakres, później trade-offy, ryzyka i testy.
4. **GitHub AI Scan PR, październik 2026** — https://github.blog/changelog/label/application-security/ . Zweryfikować oficjalną informację i ograniczenia przed napisaniem; pytanie o rolę człowieka, jakość alertów i proces exception handling.

## Szablon selekcji „Architektura w ruchu”

1. **Co dokładnie się zmieniło?** Data wydarzenia, produkt, status GA/Preview, scope, region, link źródłowy.
2. **Dlaczego ma to znaczenie?** Konkretna decyzja architektoniczna, której dotyczy.
3. **Trzy warianty działania:** adoptuj / przetestuj / poczekaj — z warunkami.
4. **Jak to sprawdzić?** Mały test lub checklist, miary, rollback i ryzyka.
5. **Czego jeszcze nie wiemy?** Nieznane ograniczenia, brak danych, hipotezy.
6. **PL/EN niezależnie.** Zero kopiowania marketingowego, brak fałszywego case study.

## Weekly

Budować spójny temat tygodnia na bazie 3–5 najważniejszych decyzji i jednej większej nowej analizy, przynajmniej jednej nowej łamigłówki i praktycznej checklisty. Nie powielać mechanicznie już opublikowanych Daily. Kontrola kanonicznych URL, RSS, sitemap, nawigacji językowej, faktycznego renderowania oraz archiwalnej niezmienności.

## Release — obowiązki redakcji i techniki

Research → kandydat PL/EN + evidence → niezależna redakcja i fact-check → poufność/licencje → PR → CI (build, content, routes, accessibility) → Vercel Preview PL/EN → QA obejmujące cały numer i SHA → delegowana decyzja (nie podszywająca się pod review Wiesława) → merge zgodny z branch protection → produkcja READY + publiczny HTTP/metadata/RSS/sitemap check. Brak któregokolwiek dowodu = pozostaje draft. Bez newsletterów i dodatkowych harmonogramów.

## Przegląd kolejki i bezpieczeństwa redakcyjnego — 25.10.2026, 16:00 Europe/Warsaw

Ten PR pozostaje **wyłącznie dokumentem warsztatowym**. Nie zawiera zgody na publikację, nie stanowi osobnego Daily ani Weekly i nie zastępuje SHA-bound release evidence. Jeden numer = jeden osobny PR. Istniejący kandydat Daily 25.10 to **PR #66**; nie tworzyć drugiego PR na tę datę.

### Kontrola powtórek i pochodzenia

- **P07**: istnieje już Daily z 24.10 o feature flag i rollbacku. Nie wydawać tej samej tezy ponownie; nowy materiał wymaga nowej sytuacji decyzyjnej i mierzalnie odmiennej wartości.
- **GitHub Actions workflow lockfiles**: materiał z 19.10 już jest w katalogu „Architektura w ruchu”; nowy tekst tylko w razie rzeczywistej, udokumentowanej zmiany statusu lub istotnych nowych skutków architektonicznych.
- **P01, P02, P04, P05**: motywy mogą przypominać realne programy i projekty organizacyjne. Przed rozwinięciem wymagana kontrola podobieństwa scenariusza, doboru parametrów, nazw, diagramów, dat, produktów i integracji do informacji niepublicznych. Nie przenosić struktury projektów, rozwiązań ani szczegółów pracodawcy nawet po anonimizacji. Bezpieczniejszy punkt startowy: P03 lub całkowicie nowy scenariusz niezwiązany z projektami użytkownika.
- **AWS Lambda Web Functions**: oficjalne ogłoszenie AWS z 12.10.2026 potwierdza uruchomienie w wymienionych regionach (m.in. Europa/Irlandia), Node.js i model bezpośredniej obsługi HTTP. Status: ogłoszona dostępność w tych regionach; nie nazywać bez dowodu globalnym GA ani dostępnością we wszystkich regionach. Źródło: https://aws.amazon.com/about-aws/whats-new/2026/10/aws-lambda-web-functions/ . Wymagana ponowna weryfikacja przed publikacją, w tym kosztów i ograniczeń.
- **Baggage / OpenTelemetry**: kandydat #66 nie jest wiadomością o premierze produktu, tylko problemem granicy zaufania; powinien pozostać materiałem edukacyjnym/łamigłówką, a nie sztuczną „Architekturą w ruchu”.

### Wzorcowa łamigłówka P03 — szkic PL (niepublikowany)

**Fikcyjny scenariusz:** mały dostawca usługi dokumentowej chce móc przenieść aplikację między dwiema chmurami w ciągu 90 dni. Usługa korzysta z bazy relacyjnej, obiektowego magazynu plików i kolejki. Brak ustalonego RTO i budżetu migracji. Zespół chce wybrać architekturę przed pomiarem wolumenu danych.

**Pytanie:** którą decyzję uzasadnisz, zanim padnie hasło „cloud-agnostic”?

1. **A — otwarte API i usługi zarządzane dostawcy.** Krótszy czas dostarczenia i mniej operacji, lecz ryzyko kosztownej migracji danych oraz różnic w semantyce usług. Wiarygodne, jeśli migracja jest mało prawdopodobna, a koszt zależności jawnie zaakceptowany.
2. **B — własna warstwa abstrakcji i wspólny runtime.** Więcej kontroli nad interfejsami i wdrożeniem, ale większy koszt platformowy i ryzyko pozornej przenośności danych. Wiarygodne przy udowodnionej potrzebie wielochmurowej i zasobach na utrzymanie platformy.
3. **C — usługi zarządzane z testowaną ścieżką wyjścia.** Utrzymaj produktywność usług natywnych, lecz opisz eksport danych, mapowanie zdarzeń i automatyzację odtworzenia w drugiej chmurze. Wiarygodne, jeśli wymaganie dotyczy rzeczywistej zdolności migracji, a nie identycznego kodu na obu platformach.

**Feedback mentora:** A nie jest „błędem”, jeśli ekonomika i ryzyko zostały świadomie przyjęte. B nie daje przenośności bez testu danych i semantyki. C nie jest darmowym kompromisem: testy migracji i kompatybilności są kosztem stałym. Przed wyborem zapytaj o ilość i tempo zmian danych, akceptowalny przestój, licencje, zależności sieciowe, wymagania regulacyjne i maksymalny koszt wyjścia.

**ADR (przykładowy, warunkowy):** decyzja wstępna C; uzasadnienie — mierzalna ścieżka migracji zamiast deklaracji neutralności. Warunki: zmierzyć czas eksportu i importu reprezentatywnego zbioru, odtworzyć kolejność/idempotencję zdarzeń, uruchomić test funkcjonalny po przełączeniu, policzyć transfer i operacje, udokumentować RPO/RTO. Jeśli test nie spełni progów określonych przez właściciela produktu, wrócić do wariantów A/B. To ćwiczenie, nie rekomendacja dla konkretnej organizacji.

### Reference puzzle P03 — English working draft (not for publication)

**Fictional scenario:** a small document-service provider wants the option to move its application between two cloud platforms within 90 days. It uses a relational database, object storage and a queue. Neither recovery objectives nor a migration budget have been agreed. The team wants to commit to an architecture before measuring the data volume.

**Decision:** which approach would you defend, and what evidence would change your mind?

1. **A — managed native services behind well-defined interfaces.** Faster delivery and lower operational overhead, but potentially expensive data migration and provider-specific behaviour. Rational when a move is unlikely and the lock-in cost is explicitly accepted.
2. **B — a shared runtime and an in-house abstraction layer.** Greater control over deployment and interfaces, at the price of platform ownership and possible false confidence about data portability. Rational when multi-cloud operation is a demonstrated requirement and the team can maintain the platform.
3. **C — managed services with a rehearsed exit path.** Keep native-service benefits while documenting data export, event mapping and recovery in the second cloud. Rational when the actual requirement is a credible migration option rather than identical infrastructure.

**Mentor feedback:** A is not inherently wrong if the trade-off is conscious. B cannot guarantee portable data or semantics. C has recurring test and compatibility costs. Ask about data size and change rate, downtime, licensing, network dependencies, compliance and exit budget before deciding.

**Illustrative ADR:** provisionally select C, subject to measured export/import duration, event-order and idempotency checks, functional tests after failover, transfer-cost modelling and explicit RPO/RTO thresholds. Revisit A/B if the rehearsal fails. This is a fictional exercise, not a recommendation for a real client.

### Dowody wymagane przed publikacją łamigłówki

Przekształcenie szkicu w materiał wydawniczy wymaga osobnego PR, autorskiej redakcji obu języków, weryfikacji źródeł i praw, testów wyświetlania trzech opcji/feedbacku, responsywności, dostępności, RSS/sitemap i działającego PL/EN Preview. Recenzent ludzki = null, o ile nie ma dowodu. Brak potwierdzonej ochrony main lub niezależnej redakcji językowej blokuje delegowany merge. Nie publikować na podstawie tego szkicu.
