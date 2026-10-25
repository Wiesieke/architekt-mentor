# ArchitectMentor — redakcyjna kolejka Daily / Weekly (25.10.2026)

Status: **warsztat i plan redakcyjny, nie opublikowane materiały, nie automatyczna zgoda na wydanie**. Obowiązuje polityka jakości repo oraz decyzja wydawcy z 25.10 o delegacji publikacji dopiero po pełnej kontroli (PR #65 musi wejść do main i bramki muszą działać).

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
