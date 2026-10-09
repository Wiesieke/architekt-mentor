# Draft review — SaaS architecture due diligence set

Date prepared: 6 October 2026
Status: **human review pending**
Publication: **blocked until Wiesław approves this revision**

## Why this set

This mini-series starts from a recurring enterprise-architecture dilemma: a provider offers a SaaS service, but the customer still owns integration, identity, endpoint/channel components, operational processes and business risk. The educational question is not whether the customer should demand every internal implementation detail. It is which architectural facts are necessary to accept the service responsibly.

The scenario below is **composite and anonymised**. It deliberately does not describe a named supplier, customer, procurement or implementation. It does not claim a real outage, accepted design or observed result.

Primary guidance checked on 6 October 2026:
- Microsoft Azure Well-Architected Framework, SaaS design principles — shared responsibility and operational excellence: https://learn.microsoft.com/en-us/azure/well-architected/saas/design-principles
- Microsoft Azure Well-Architected Framework, SaaS design methodology — deployment location, customer environment, reliability targets and tenancy choices: https://learn.microsoft.com/en-us/azure/well-architected/saas/design-methodology
- AWS Well-Architected Framework — due diligence and shared responsibility for third-party SaaS access: https://docs.aws.amazon.com/wellarchitected/latest/framework/
- AWS SaaS deployment architectures with Amazon EKS — responsibility boundaries differ for provider-hosted, remote and hybrid models: https://aws.amazon.com/blogs/containers/saas-deployment-architectures-with-amazon-eks/

These sources support the general principles. The scenario, decision model, checklist and wording below are original educational synthesis.

---

# 1. PRACTICE / ŁAMIGŁÓWKA

## PL

### Tytuł
**Dostawca daje SaaS. Czy musisz znać jego architekturę?**

### Poziom
Średni

### Cel nauki
Odróżnić szczegóły implementacyjne dostawcy od informacji architektonicznych potrzebnych do oceny odpowiedzialności, ryzyka i integracji rozwiązania SaaS.

### Scenariusz
**Złożony scenariusz edukacyjny. Łączy typowe problemy przeglądu usług SaaS i nie opisuje konkretnej organizacji ani dostawcy.**

Organizacja rozważa zewnętrzną usługę SaaS do obsługi ważnego procesu transakcyjnego. Dostawca utrzymuje aplikację, bazę danych i infrastrukturę we własnym środowisku. Klient ma jednak zbudować własny kanał użytkownika, połączyć usługę z tożsamością organizacji, przekazywać część danych biznesowych i obsługiwać incydenty pierwszej linii.

Dostawca przekazał opis API, SLA oraz ogólną informację o bezpieczeństwie. Na pytanie o architekturę odpowiada: „To SaaS — szczegóły wewnętrznej implementacji są po naszej stronie”. Nie ma jeszcze jasnej informacji o granicach odpowiedzialności, lokalizacji i retencji danych, sposobie izolacji klientów, zależnościach krytycznych, procedurze awarii, RTO/RPO, telemetryce dostępnej klientowi ani mechanizmie zakończenia usługi i eksportu danych.

Biznes chce szybko zatwierdzić kierunek. Zespół techniczny dzieli się na dwa obozy: „bez pełnego diagramu dostawcy niczego nie zatwierdzamy” oraz „to SaaS, więc architektura dostawcy nas nie interesuje”.

### Pytanie
**Jaką decyzję podejmiesz na tym etapie? Wskaż, których informacji o rozwiązaniu SaaS potrzebujesz przed akceptacją architektury, a których szczegółów wewnętrznych możesz świadomie nie wymagać.**

### Pytania naprowadzające
- Czy znajomość języka programowania, klastra lub wewnętrznego podziału mikroserwisów zmienia Twoją odpowiedzialność jako klienta?
- Czy SLA bez opisu granicy usługi, sposobu pomiaru i odtwarzania wystarcza do oceny niezawodności?
- Kto odpowiada za tożsamość, role, dane, konfigurację, monitoring i obsługę incydentu na styku obu organizacji?
- Jak potwierdzisz zachowanie systemu, kiedy API działa, ale krytyczna funkcja biznesowa jest niedostępna?
- Co stanie się z danymi, integracjami i kanałem klienta przy zmianie dostawcy lub zakończeniu umowy?

### Szybka decyzja
**Która odpowiedź jest najlepsza przy podanych założeniach?**

A. Wymagać pełnego HLD dostawcy, łącznie z technologiami, topologią infrastruktury i diagramami jego komponentów. Bez tego SaaS nie może zostać zaakceptowany.

B. Uznać architekturę dostawcy za całkowicie poza zakresem, ponieważ model SaaS przenosi odpowiedzialność za technologię na dostawcę. Wystarczą API i SLA.

C. Nie wymagać pełnego projektu wewnętrznego, ale zażądać dowodów dotyczących granic odpowiedzialności, kontraktów integracyjnych, danych, IAM, izolacji, NFR, odtwarzania, obserwowalności, incydentów i wyjścia z usługi. Zatwierdzić rozwiązanie dopiero wtedy, gdy te granice są jawne i testowalne.

**Poprawna:** C

### Wyjaśnienie odpowiedzi
- **A:** pełna znajomość implementacji może tworzyć pozorną kontrolę i szybko się dezaktualizować. Klient nie musi zarządzać szczegółami, których nie kontroluje, chyba że konkretne ryzyko, regulacja lub model wdrożenia tego wymaga.
- **B:** SaaS zmienia zakres odpowiedzialności, ale go nie usuwa. Klient nadal odpowiada za własne dane, konfigurację, tożsamość, integracje, kanały, procesy i akceptację ryzyka.
- **C:** ocena skupia się na architektonicznie istotnym „surface area” usługi: granicach, zachowaniu, ryzyku, dowodach i odpowiedzialności, nie na kolekcjonowaniu szczegółów implementacyjnych.

### Kryteria mentora
1. **Granica odpowiedzialności** — rozróżnia elementy kontrolowane przez dostawcę i klienta; nie sprowadza SaaS do „wszystko po stronie dostawcy”.
2. **Informacja istotna architektonicznie** — wymaga danych o kontraktach, danych, IAM, NFR, DR, observability, incydentach i exit strategy, zamiast pełnego wewnętrznego HLD bez uzasadnienia.
3. **Dowód przed akceptacją** — proponuje testy, warunki lub artefakty pozwalające zamknąć niepewność: odpowiedzialność RACI, test integracyjny/failure test, mierzalne SLA/SLO, proces incydentu, eksport danych albo scenariusz odtworzenia.

### Analiza seniora
#### SaaS nie usuwa architektury — przesuwa granicę
Najważniejsza decyzja nie dotyczy tego, czy dostawca używa kontenerów, maszyn wirtualnych czy konkretnej bazy danych. Jeżeli klient nie zarządza tymi elementami i ich zmiana nie narusza uzgodnionego kontraktu, szczegóły mogą pozostać wewnętrzne.

Architekt klienta musi jednak rozumieć **system, który powstaje na styku organizacji**. Granica rozwiązania obejmuje nie tylko API, lecz także przepływ tożsamości, dane, konfigurację, kanały użytkownika, zależności, procedurę awarii, telemetrykę i operacje day-2.

#### Minimalny zestaw informacji przed decyzją
1. **Service boundary i odpowiedzialność.** Co dokładnie jest usługą? Kto odpowiada za endpoint klienta, IAM, konfigurację, dane, certyfikaty, integrację i pierwszą reakcję na incydent?
2. **Dane.** Gdzie są przetwarzane i przechowywane, jak długo, jak są separowane pomiędzy klientami, jak wygląda backup, eksport i usunięcie?
3. **Tożsamość i dostęp.** Jak działa federacja, role, uprzywilejowany dostęp dostawcy, audyt i odebranie dostępu?
4. **NFR.** Dostępność, wydajność, limity, RTO, RPO, maintenance windows, skalowanie oraz sposób mierzenia zobowiązań.
5. **Failure model.** Co obserwuje klient, kiedy usługa lub jej zależność zawodzi? Jakie są timeouty, retry, degradacja, komunikacja incydentowa i eskalacja?
6. **Observability.** Jakie metryki, logi, identyfikatory korelacyjne i statusy dostaje klient? Co pozwala odróżnić błąd po swojej stronie od awarii SaaS?
7. **Lifecycle i exit.** Jak zmieniają się API, jak wygląda wersjonowanie, eksport danych, okres przejściowy i zakończenie usługi?

#### Czego zwykle nie trzeba znać
Nie trzeba wymagać nazw każdego mikroserwisu, szczegółowej topologii klastra, konfiguracji każdego load balancera czy języka implementacji, jeśli nie wpływają na wymaganie, ryzyko, zgodność, kontrakt lub obowiązek klienta. Wyjątki powstają wtedy, gdy regulacja, bezpieczeństwo, customer-hosted data plane, dedykowany komponent w środowisku klienta albo wymaganie audytowe wprowadza dodatkową odpowiedzialność.

#### Jak zamknąć decyzję dowodami
Zamiast prosić tylko o „więcej dokumentacji”, zbuduj **macierz odpowiedzialność → wymaganie → dowód**. Przykładowo: RTO 4 h → procedura odtworzenia + wynik regularnego testu; SSO → kontrakt federacji + test logowania/odebrania roli; izolacja danych → opis modelu izolacji + odpowiedni dowód bezpieczeństwa; exit → format eksportu + test próbnego eksportu.

> Nie potrzebujesz pełnej mapy kuchni dostawcy. Musisz wiedzieć, co zamawiasz, gdzie kończy się jego odpowiedzialność, gdzie zaczyna Twoja i jak sprawdzisz, że granica działa.

---

## EN

### Title
**The provider delivers SaaS. Do you need to know its architecture?**

### Difficulty
Intermediate

### Learning goal
Distinguish vendor implementation details from the architectural information needed to assess responsibility, integration and risk in a SaaS solution.

### Scenario
**Composite educational scenario. It combines recurring SaaS review dilemmas and does not describe a specific organisation or provider.**

An organisation is considering an external SaaS service for an important transactional process. The provider operates the application, database and infrastructure in its own environment. The customer must still build its own user channel, integrate enterprise identity, exchange business data and provide first-line incident handling.

The provider has supplied API documentation, an SLA and a high-level security statement. Asked for architecture details, it replies: “It is SaaS; internal implementation is our responsibility.” The customer still lacks a clear responsibility boundary, data location and retention model, tenant-isolation explanation, critical dependencies, failure procedure, RTO/RPO, customer-visible telemetry and exit/export process.

Business stakeholders want a quick decision. The technical team splits into two camps: “No approval without the vendor’s full HLD” and “It is SaaS, so the vendor architecture is irrelevant to us.”

### Question
**What decision would you make at this stage? Which architectural information do you need before accepting the solution, and which internal implementation details can you deliberately leave with the provider?**

### Guiding questions
- Does knowing the programming language, cluster type or internal microservice layout change a responsibility you actually own?
- Does an SLA without a service boundary, measurement method and recovery model prove resilience?
- Who owns identity, roles, data, configuration, monitoring and incident handling across the organisational boundary?
- How will you verify the business journey when the API is reachable but a critical capability is unavailable?
- What happens to data, integrations and the customer channel when the contract ends or the provider changes?

### Quick decision
A. Require the provider’s complete HLD, infrastructure topology and internal component design before any SaaS architecture can be accepted.

B. Treat provider architecture as entirely out of scope because SaaS transfers technical responsibility to the provider. APIs and SLA are sufficient.

C. Do not require the complete internal implementation, but require evidence for responsibility boundaries, integration contracts, data, IAM, isolation, NFRs, recovery, observability, incident handling and exit. Accept the architecture only when these boundaries are explicit and testable.

**Correct:** C

### Mentor criteria
1. **Responsibility boundary** — distinguishes provider and customer responsibilities rather than treating SaaS as total responsibility transfer.
2. **Architecturally significant information** — asks for contracts, data, IAM, NFRs, DR, observability, incidents and exit evidence instead of an unjustified full internal HLD.
3. **Evidence before acceptance** — proposes tests, conditions or artefacts that close uncertainty, such as a responsibility matrix, failure test, measurable SLA/SLO, incident process, recovery evidence or export test.

### Senior analysis
#### SaaS moves the boundary; it does not remove architecture
The customer does not automatically need to know whether the provider uses containers, virtual machines or a particular database. If those components are fully provider-operated and can change without breaking the agreed service contract, they may remain internal.

The customer architect still needs to understand the **system created across the organisational boundary**: identity, data flows, configuration, customer-owned channels, failure behaviour, telemetry and day-2 operations.

#### Minimum information before approval
1. Service boundary and responsibility.
2. Data processing, location, retention, isolation, backup, export and deletion.
3. Identity, roles, privileged provider access and audit.
4. Availability, performance, limits, RTO/RPO and maintenance behaviour.
5. Failure modes, timeout/retry semantics, degradation and escalation.
6. Customer-visible observability and correlation.
7. API/service lifecycle, change policy and exit strategy.

#### Evidence, not architecture theatre
Build a matrix of **responsibility → requirement → evidence**. For example, an RTO needs a recovery procedure and evidence from a drill; SSO needs a federation contract and role-revocation test; exit needs an export format and a rehearsal. This is more useful than collecting a vendor diagram that is detailed but unrelated to your decision.

> You do not need a map of the provider’s entire kitchen. You need to know what service you are buying, where responsibility changes hands and how you will verify the boundary.

---

# 2. FOUNDATION

## PL title
**Due diligence architektury SaaS: czego klient musi wiedzieć**

Permanent candidate URL: `/podstawy-architektury/due-diligence-saas/`

### Lead
Zakup SaaS zmniejsza zakres technologii, którą klient sam projektuje i operuje. Nie usuwa jednak odpowiedzialności za integrację, dane, tożsamość, proces biznesowy i akceptację ryzyka. Dobry przegląd SaaS nie próbuje odtworzyć wewnętrznego HLD dostawcy. Ustala granicę odpowiedzialności i wymaga dowodów dla tego, co przekracza tę granicę.

### Cel nauki
Umieć dobrać zakres architektonicznego due diligence do realnej odpowiedzialności klienta oraz zamienić pytania o „architekturę dostawcy” na wymagania i dowody potrzebne do decyzji.

### Proposed full structure

#### 1. Zacznij od modelu odpowiedzialności
Podział obowiązków nie wynika automatycznie z etykiety SaaS. Zależy od modelu wdrożenia i integracji. Czysty provider-hosted SaaS daje inną granicę niż rozwiązanie z agentem, terminalem, komponentem lub data plane działającym w środowisku klienta.

Pierwszym artefaktem powinien być nie diagram technologii, lecz macierz odpowiedzialności obejmująca co najmniej: usługę SaaS, kanał klienta, IAM, dane, integracje, sieć, konfigurację, certyfikaty/sekrety, monitoring, incident management, continuity i exit.

#### 2. Rozdziel „jak dostawca to zbudował” od „jak usługa zachowuje się na granicy”
Pytania o język, framework czy liczbę mikroserwisów są przydatne tylko wtedy, gdy prowadzą do ryzyka, które klient musi ocenić. Znacznie ważniejsze są: kontrakt API, ograniczenia, semantyka błędów, lifecycle, izolacja, sposób pracy administratorów dostawcy oraz zachowanie podczas awarii.

#### 3. Siedem obszarów due diligence
| Obszar | Co trzeba ustalić | Przykład dowodu |
|---|---|---|
| Odpowiedzialność | kto operuje czym i kto reaguje | RACI / responsibility matrix |
| Dane | lokalizacja, retencja, izolacja, backup, eksport | data flow + polityka + test eksportu |
| IAM | federacja, role, PIM/PAM, dostęp supportu | test SSO i odebrania uprawnień |
| Integracja | API, wersjonowanie, limity, błędy | kontrakt + test negatywny/failure test |
| NFR | dostępność, latency, capacity, RTO/RPO | SLO/SLA + sposób pomiaru + drill |
| Operacje | monitoring, status, incydent, zmiana | runbook + telemetry + escalation path |
| Exit | przenośność danych i zakończenie usługi | format eksportu + exit rehearsal |

#### 4. RTO/RPO i SLA nie mogą być dekoracją
SLA mówi niewiele, jeśli nie wiadomo, co dokładnie jest mierzone i z której perspektywy. RTO/RPO wymagają zdefiniowania granicy danych i funkcji. Jeżeli klient utrzymuje własny kanał, pełny user journey może mieć inne RTO niż sama usługa dostawcy.

#### 5. Observability jest częścią kontraktu operacyjnego
Klient nie potrzebuje dostępu do każdego wewnętrznego logu dostawcy. Potrzebuje wystarczającej informacji, aby rozpoznać stan usługi i własnych integracji: health/status, korelacja, podstawowe metryki, kody błędów, incident communication i ścieżka eskalacji.

#### 6. Im więcej elementów działa po stronie klienta, tym mniej „czysty” jest SaaS
Agent, terminal, konektor, gateway lub data plane po stronie klienta zwiększa customer-owned architecture. Wtedy potrzebna jest zgodność wersji, model upgrade’u, wsparcie OS/runtime, wymagania sieciowe, telemetria i rollback. Nie wolno nadal oceniać rozwiązania tak, jakby było wyłącznie zdalną stroną WWW.

#### 7. Exit strategy jest wymaganiem architektonicznym
Vendor lock-in nie oznacza, że należy unikać usług zarządzanych. Oznacza, że trzeba wiedzieć, które elementy są trudno przenośne i co stanie się przy wyjściu. Dla krytycznej usługi potrzebne są format danych, kompletność eksportu, czas udostępnienia, sposób usunięcia kopii oraz wygaszenie integracji i tożsamości.

#### Decision rule
**Nie pytaj: „czy znamy architekturę dostawcy?”. Pytaj: „czy znamy wszystkie granice, ryzyka i zachowania, za które odpowiadamy albo od których zależymy — i czy mamy dla nich dowód?”.**

### Sources section
Primary sources checked 6 October 2026: Microsoft Azure Well-Architected SaaS design principles and methodology; AWS Well-Architected third-party SaaS due diligence and shared responsibility guidance; AWS SaaS deployment-architecture guidance. The seven-area checklist and responsibility→requirement→evidence model are original synthesis for ArchitectMentor.

---

## EN title
**SaaS architecture due diligence: what the customer needs to know**

Permanent candidate URL: `/en/foundations/saas-architecture-due-diligence/`

### Lead
Buying SaaS reduces the technology a customer must design and operate. It does not remove responsibility for integration, identity, data, business continuity and risk acceptance. Useful due diligence does not try to reconstruct the provider’s internal HLD. It defines the responsibility boundary and asks for evidence where the service crosses it.

### Core structure
Use the same seven areas as the PL version: responsibility; data; IAM; integration; NFRs; operations; exit. Explain that deployment models change the responsibility split and that customer-hosted agents/data planes require deeper compatibility and operational evidence.

### Decision rule
**Do not ask only “Do we know the provider’s architecture?”. Ask “Do we know every boundary, risk and behaviour that we own or depend on, and do we have evidence for it?”.**

---

# 3. ANTI-PATTERN

## PL title
**To SaaS, więc architektura dostawcy nas nie interesuje**

Candidate URL: `/antywzorce/2026-10-06-saas-nas-nie-interesuje/`

### Summary
Zespół traktuje model SaaS jak całkowite przeniesienie odpowiedzialności i akceptuje API oraz SLA bez ustalenia danych, IAM, failure model, observability, recovery i exit strategy.

### Content
**Złożony scenariusz edukacyjny. Nie opisuje konkretnej organizacji ani dostawcy.**

## Sytuacja
Organizacja kupuje usługę SaaS. Własny zespół ma zbudować kanał użytkownika i integrację, ale dokumentacja architektoniczna zostaje sprowadzona do diagramu „nasz system → API SaaS”. W przeglądzie pada argument: „Nie utrzymujemy ich serwerów, więc ich architektura nas nie interesuje”.

## Gdzie powstaje antywzorzec
Prawdziwe stwierdzenie — klient nie zarządza wewnętrzną technologią dostawcy — zostaje rozszerzone na fałszywy wniosek, że nie trzeba rozumieć zachowania usługi ani granicy odpowiedzialności. W rezultacie elementy, których klient nie kontroluje, stają się jednocześnie zależnościami, których nikt nie opisał.

## Objawy
- API i SLA są traktowane jako kompletny opis rozwiązania;
- brak właściciela dla błędów występujących pomiędzy kanałem klienta a SaaS;
- nikt nie potrafi powiedzieć, gdzie przetwarzane i retencjonowane są dane;
- IAM opisuje tylko logowanie, bez ról, dostępu supportu i odebrania uprawnień;
- RTO/RPO dotyczą „platformy”, ale nie pełnej ścieżki biznesowej;
- monitoring klienta kończy się na kodzie HTTP;
- zmiana lub zakończenie dostawcy nie ma procedury eksportu i odłączenia.

## Konsekwencje
Podczas incydentu obie strony mogą widzieć zielone własne komponenty, a użytkownik nadal nie wykonuje procesu. Niejasne odpowiedzialności wydłużają eskalację. Ograniczenia danych albo wersjonowania wychodzą dopiero przy wdrożeniu. Exit strategy powstaje w chwili, gdy organizacja już chce wyjść.

## Lepsza decyzja
1. Zdefiniuj granicę usługi i odpowiedzialność obu stron.
2. Opisz przepływ danych, IAM i kontrakty integracyjne.
3. Ustal NFR oraz sposób ich pomiaru i dowodzenia.
4. Zaprojektuj model operacyjny: monitoring, korelację, incydenty, maintenance i recovery.
5. Ustal lifecycle oraz exit przed uzależnieniem procesu od usługi.
6. Żądaj szczegółów implementacyjnych tylko wtedy, gdy konkretne wymaganie albo ryzyko ich potrzebuje.

## Granica
Przeciwieństwem tego antywzorca nie jest mikrozarządzanie dostawcą. W SaaS celowo deleguje się znaczną część implementacji i operacji. Dojrzałość polega na tym, aby delegować **świadomie**, z jawnym kontraktem odpowiedzialności i dowodami dla zachowania, od którego zależy organizacja.

> „Nie operujemy ich infrastruktury” nie oznacza „nie musimy rozumieć usługi”.

---

## EN title
**It is SaaS, so the provider architecture is none of our concern**

Candidate URL: `/en/anti-patterns/2026-10-06-saas-none-of-our-concern/`

### Summary
A team treats SaaS as a complete transfer of responsibility and accepts APIs and an SLA without establishing data, IAM, failure behaviour, observability, recovery or exit.

### Core content
Mirror the PL structure: situation; where the anti-pattern appears; warning signs; consequences; better decision; boundary. Preserve the central distinction: the customer does not need to micromanage provider internals, but must understand the service boundary and behaviours it depends on.

> “We do not operate their infrastructure” does not mean “we do not need to understand the service.”

---

# Cross-linking plan

Practice → Foundation: direct link to SaaS due diligence checklist.
Practice → Anti-pattern: direct link to the false “SaaS means no architecture review” shortcut.
Foundation → Practice: decision exercise.
Foundation → Anti-pattern: common failure mode.
Anti-pattern → Foundation + Practice.

The three items should be registered as one edition so PL and EN fail closed together if any translation is missing.

# Follow-up mini-series already planned

## Series 2 — customer-owned terminal around SaaS
Practice: **Dostawca nie obsługuje naszego terminala. Czy nadal kupujemy gotowy SaaS?**
Foundation: **Granice odpowiedzialności w modelu SaaS + własny kanał**
Anti-pattern: **Kupujemy SaaS, a potem przypadkiem budujemy połowę produktu sami**

## Series 3 — hidden operational integration scope
Practice: **API działa. Kto odpowiada za IAM, monitoring, retry i support?**
Foundation: **Contract surface vs operational surface**
Anti-pattern: **Integracja kończy się na API**

# Review checklist for Wiesław

1. Czy pierwszy scenariusz trafia w realny dylemat architekta, ale jest wystarczająco odanonimizowany?
2. Czy rozróżnienie „internal implementation detail” vs „architecturally significant boundary information” jest wystarczająco ostre?
3. Czy lista siedmiu obszarów due diligence jest kompletna, ale nie przeładowana?
4. Czy określenie „Due diligence architektury SaaS” brzmi naturalnie po polsku, czy lepiej „Przegląd architektoniczny SaaS przed zakupem/wdrożeniem”?
5. Czy antywzorzec ma właściwy ton — mocny, ale nie atakujący dostawców SaaS?
6. Po akceptacji: dopiero wtedy integracja z katalogiem, pełne PL/EN, build, testy, Preview i publikacja.

Human reviewer: pending
Reviewed revision: pending
Decision: draft
Approval evidence: pending
