# ArchitectMentor Master Context v5

Stan na 2 października 2026 r.  |  Wersja 5.0

Trwały kontekst projektu ejsymont.com. Dokument zastępuje Master Context v4 z 1 października 2026 r. Zachowuje misję i zasady projektu oraz zapisuje sekcję architektury z AI i pilotaż wydarzeń zatwierdzony przez Wiesława 2 października. Bieżący stan kodu i publikacji należy potwierdzać w głównej gałęzi GitHuba i na produkcji.

## Tożsamość i cel projektu

ArchitectMentor jest autorskim portalem edukacyjnym Wiesława Ejsymonta o architekturze korporacyjnej i rozwiązań, integracji oraz decyzjach technicznych i organizacyjnych. Docelowo stanowi magazyn decyzji architektonicznych i interaktywny warsztat mentora.

Główne pytanie portalu brzmi: jak myśli architekt, kiedy nie istnieje jedna oczywista odpowiedź? Materiały rozwijają umiejętność rozpoznania problemu, określenia ograniczeń, zadawania pytań, oceny ryzyka, porównania wariantów i zapisania konsekwencji decyzji.

## Autor i wiarygodność

Autorem jest Wiesław Ejsymont. W kontekście projektu przyjęto ponad 40 lat doświadczenia w IT oraz ponad 20 lat w architekturze rozwiązań i korporacyjnej. Jego droga zaczęła się od wcześniejszych generacji komputerów, m.in. IBM PC 286, systemów takich jak Solaris, sieci oraz programowania w asemblerze, C i Javie, a następnie rozwijała się wraz z kolejnymi przemianami technologicznymi aż po współczesne systemy i AI. Początkowe technologie są etapem kariery, nie ograniczeniem kompetencji. Nie dopisujemy niepotwierdzonych klientów, wdrożeń ani wyników.

## Odbiorcy i języki

Odbiorcy to architekci rozwiązań, korporacyjni i oprogramowania, liderzy techniczni, senior developerzy, analitycy i managerowie technologiczni. Portal ma pomagać zarówno osobom przygotowującym się do roli architekta, jak i praktykom z doświadczeniem.

English pozostaje strategicznie główną edycją publikacyjną pod /en/. Polska strona główna jest pod /pl/, a istniejące polskie materiały zachowują adresy bez tego prefiksu, np. /podstawy-architektury/. Wybór kraju dotyczy wejścia na adres główny; jawne adresy językowe pozostają stabilne. Tłumaczenia mają przekazywać tę samą wiedzę i brzmieć naturalnie.

## Zasady redakcyjne i formaty

## Praktyka decyzji architektonicznych

Preferowany tok materiału: kontekst i problem, pytania oraz ograniczenia, odpowiedź czytelnika, analiza mentora, porównanie wariantów, decyzja i jej konsekwencje, a następnie ADR lub przenośna lekcja. Format dopasowujemy do tematu; nie każdy tekst musi zawierać wszystkie elementy.

| Sekcja | Rola materiału |
| --- | --- |
| Architektura w ruchu | Istotna zmiana technologiczna, potwierdzone fakty i wpływ na decyzje. Rozróżniamy datę wydarzenia i datę publikacji. |
| Podstawy architektury | Pojęcie wyjaśnione przez problem, przykład, konsekwencje i zastosowanie. |
| Łamigłówki | Konkretna decyzja w dwóch wariantach: szybki wybór z wyjaśnieniem lub warsztat rozumowania z mentorem. Nowe ćwiczenia zaczynają od poziomu łatwego albo średniego. |
| Antywzorce | Dlaczego pozornie rozsądne rozwiązanie powstaje, kiedy szkodzi i jak je poprawić. |
| HLD i ADR | Warsztat opisu architektury i dokumentowania jednej konkretnej decyzji. |

## Rzeczywiste i fikcyjne przypadki

Preferujemy rzeczywiste dylematy po anonimizacji. Usuwamy nazwy organizacji, systemów i dostawców, nazwiska, identyfikatory, wrażliwe wartości biznesowe oraz szczegóły pozwalające rozpoznać źródło. W razie potrzeby zmieniamy okoliczności bez zmiany istoty problemu.

Scenariusze fikcyjne i złożone z typowych sytuacji są jawnie oznaczane. Dla ćwiczeń inspirowanych praktyką stosujemy dokładny zapis „Scenariusz edukacyjny inspirowany praktyką”, bez dopisku o zmienionych szczegółach. W EN: „Practice-inspired educational scenario”. Nie przedstawiamy rozważań kontraktowych, propozycji ani symulacji jako potwierdzonego historycznego incydentu. Przed publikacją sprawdzamy poufność i rozpoznawalność źródła.

## Styl i rytm publikacji

Ton doświadczonego praktyka: konkretny, spokojny, mentorski, bez nadęcia i pustych fraz. Jakość i wiarygodność mają pierwszeństwo przed liczbą tekstów. Bieżący rytm redakcyjny jest zapisany w Working Context; nowości technologicznych nie publikujemy na siłę.

## Architektura i obsługa danych

| Obszar | Stały punkt odniesienia |
| --- | --- |
| Domena i kod | ejsymont.com; GitHub Wiesieke/architekt-mentor jako główne źródło kodu. |
| Aplikacja i hosting | Astro, statyczne strony oraz funkcje API uruchamiane na Vercel. |
| Poczta | sensinte.com na LH.pl; skrzynka projektu architektura@sensinte.com. |
| Baza | MySQL na LH.pl. Vercel komunikuje się z pośrednikiem PHP przez HTTPS i tajny token. |
| Dane narzędzi | Briefy i wyniki HLD oraz odpowiedzi i feedback łamigłówek mogą być zapisywane po zgodzie użytkownika. Obowiązuje retencja i cleanup. |
| Newsletter | MailerLite prowadzi subskrypcje, potwierdzenie i wypisanie. Lista nie jest przechowywana w bazie LH.pl. |

## Newsletter i publikacje

Newsletter został wdrożony jako osobny proces. Edycje PL i EN korzystają z osadzonych formularzy MailerLite. Double opt-in i wypisanie pozostają częścią obsługi subskrypcji. Dodanie komentarza ani użycie narzędzia nie jest zapisem na newsletter.

RSS /rss.xml oraz /en/rss.xml udostępnia datowane artykuły i antywzorce do wykorzystania w procesie kampanii. RSS stanowi źródło treści; sam nie dowodzi skonfigurowania automatycznej wysyłki w MailerLite. Nie deklarujemy sterowania kampaniami przez ChatGPT, jeśli brak takiego połączenia.

## AI i narzędzia

OpenAI Responses API obsługuje na produkcji moderację komentarzy, mentora łamigłówek i generator HLD. Mentor korzysta z gpt-4.1-mini oraz ścisłego schematu JSON z wymaganymi identyfikatorami kryteriów. HLD domyślnie korzysta z gpt-4.1, z możliwością wyboru gpt-4.1-mini oraz gpt-6.1-sol. Klucz OPENAI_API_KEY pozostaje na Vercel po stronie serwera. Wywołania stosują store: false; zapis w bazie projektu nadal wymaga zgody użytkownika. Wariant szybki ćwiczeń nie wywołuje AI. Migrację mentora i HLD wdrożono przez PR #32. Opcjonalny GPT-6.1 Sol i sekcję tutoriali wdrożono 2 października przez PR #35. Domyślny model HLD nadal to gpt-4.1; Sol stosuje reasoning effort low bez temperature. Pomyślny test API i renderowania Mermaid potwierdza działanie przykładu, nie poprawność każdego przyszłego projektu.

ADR jest lokalnym formularzem w przeglądarce z pobraniem projektu decyzji w Markdown. Nie utożsamiamy go z generatorem AI ani zatwierdzeniem decyzji w organizacji. Klucze i hasła pozostają po stronie serwera; dokumenty kontekstowe nie zawierają ich wartości.

## Mentor i zasady komentarzy

## Ocena rozumowania

Ocena nie polega na porównaniu odpowiedzi z jednym idealnym tekstem. Wzorzec seniora i kryteria pomagają ocenić dostrzeżone ograniczenia, interesariuszy, dane, integrację, bezpieczeństwo, odporność, koszty, operacyjność, ryzyka oraz kompromisy. Różne uzasadnione rozwiązania są dopuszczalne.

Warsztat z mentorem zachowuje tok: odpowiedź, mocny element i pytanie naprowadzające, poprawiona odpowiedź, a potem analiza i ocena. Dla nowych ćwiczeń łatwych i średnich wystarczą 2–3 zdania i trzy kryteria po 0–2 punkty, razem maksymalnie 6. Kryteria odpowiadają jednemu celowi ćwiczenia; mentor nie wymaga pełnego projektu systemu. Wariant szybki pokazuje wyjaśnienie po wyborze, a analiza seniora pozostaje dostępna bez AI.

## Zatwierdzony kierunek moderacji

Od 1 października 2026 r. wdrożony model nowych komentarzy to Turnstile, zapis w bazie, ocena AI przez backend i publikacja, odrzucenie oczywistego nadużycia albo kolejka moderatora. Po potwierdzonym zatwierdzeniu komentarz pojawia się pod artykułem bez odświeżenia strony. Odrzucony tekst pozostaje do poprawy. Obowiązkowe potwierdzenie e-maila nie jest warunkiem publikacji nowych komentarzy.

Turnstile ogranicza boty; treść sprawdza backend poprzez API. Ten czat nie obserwuje strony w tle.

Merytoryczna krytyka autora, pytania, techniczne cytaty i uzasadnione odmienne stanowisko są dozwolone.

Komentarz nie jest publiczny przed sprawdzeniem. Niepewność, brak klucza lub awaria AI prowadzą do ręcznej moderacji.

E-mail pozostaje prywatny. Do oceny AI trafiają treść, nazwa wyświetlana oraz kontekst artykułu; e-mail i skrót źródła nie są przekazywane.

Komentarze i subskrypcje newslettera pozostają niezależne. Nie obiecujemy określonej skuteczności ani procentu automatycznych zatwierdzeń.

## Ćwiczenia w dwóch wariantach

Od 1 października 2026 r. na produkcji działa pilotaż trzech scenariuszy. Wariant szybki jest widoczny na początku i zajmuje około 2 minut. Czytelnik może od razu wybrać warsztat z mentorem, około 10 minut. Przełączenie zachowuje wybór i wpisany tekst.

### Nowe tablety z tą samą aplikacją

Poziom łatwy. Cel: zbadać wpływ zmiany urządzenia zamiast zakładać brak wpływu albo konieczność przebudowy. Sprawdzamy zgodność aplikacji, tożsamość i uprawnienia oraz komunikację. Materiał Ucz się: analiza wpływu zmiany i granice systemu w C4.

### Nieznany wynik rezerwacji

Poziom średni. Cel: odróżnić timeout od potwierdzonego niepowodzenia. Scenariusz podaje kontrakt bezpiecznych, ograniczonych ponowień z tym samym identyfikatorem, a następnie lookup. Reversal płatności jest dopuszczony w tym ćwiczeniu dopiero po potwierdzeniu braku rezerwacji. Nie przenosimy tej reguły na każdy system. Materiał Ucz się: idempotencja, lookup i warunkowa kompensacja.

### Gotowy wynik przy awarii opcjonalnego zapisu

Poziom łatwy. Cel: rozdzielić podstawowy wynik od dodatkowego zapisu. Gotowy dokument można bezpiecznie pokazać i pobrać, ale trzeba uczciwie ujawnić brak zapisu. Założenie: zapis nie jest obowiązkowym warunkiem biznesowym. Materiał Ucz się: graceful degradation.

## Szablon kolejnego ćwiczenia

1. Wybierz jedną prostą lub średnio trudną decyzję z praktyki. Zapisz cel nauki, fakty, niewiadome i założenia. Anonimizuj źródło; symulację oznaczaj jako scenariusz edukacyjny.

2. Wariant szybki: trzy wiarygodne możliwości, jeden najlepszy wybór przy danych założeniach, opcjonalna wskazówka i wyjaśnienie każdej możliwości. Zmieniaj pozycję najlepszego wyboru. Po błędzie pokaż ryzyko i uzasadniony lepszy wybór.

3. Warsztat: pytanie o decyzję i uzasadnienie w 2–3 zdaniach, jedno pytanie mentora, poprawiona odpowiedź i trzy kryteria oceny. Przygotuj analizę seniora z alternatywami, ograniczeniami i konkretnym sposobem sprawdzenia.

4. Przygotuj powiązany materiał Ucz się w PL i EN. Objaśnij wzorzec lub technikę przez problem, przykład i granice stosowania. Dodaj źródło pierwotne oraz obustronne linki do stałych adresów.

5. Dane szablonu: id, title, difficulty, goal, scenario, question, hints, analysis, quick.question, quick.hint, quick.correctId, quick.options z id, text i explanation, trzy criteria z id, label i expected oraz learnSlug. Każdy wariant językowy ma równoważne założenia.

6. Rejestruj treści w starter-exercises.json, puzzles.json i puzzle-coach-en.json oraz artykuły i edycję. Rejestracja jest obecnie jawna, a nie automatyczna. Sprawdź wybory, tłumaczenia, linki, przełączanie trybów, fokus, zgodę na zapis, błędy API oraz zachowanie starszych ćwiczeń.

7. Publikuj po autoryzacji produkcji i sprawdź działające strony. Zapisz decyzje w Master Context. Szczegółowy szablon: https://github.com/Wiesieke/architekt-mentor/blob/main/docs/exercise-template.md

### Pomiar i kolejne etapy

Kolejny krok to obserwacja ukończeń, zainteresowania mentorem i powrotów czytelników, a następnie krótka ścieżka tematyczna oraz promocja przez newsletter. Pomiar tych zdarzeń pozostaje do wdrożenia; nie opisujemy go jako już działającego.

### Pilotaż wydarzeń

Pilotaż sekcji Warto wziąć udział / Worth attending został zatwierdzony 2 października 2026. Cztery pierwsze karty PL/EN i plan czterech tygodni opisano w końcowej części dokumentu. Sekcja uzupełnia codzienne wydanie; partnerstwa wymagają jawnego oznaczenia i nie zakładamy przychodów.

## Rozwój i pomiar

Rozwijamy portal przez cykl publikacja, reakcja czytelników, pomiar i poprawa. Nie przebudowujemy wszystkich modułów jednocześnie. Wartość oceniamy także przez powroty, czas czytania, ukończenie ćwiczeń, zapisy na newsletter, kontakt i jakość dyskusji. KPI oraz docelowy audyt decyzji AI pozostają do doprecyzowania.

## Rejestr decyzji i ciągłość pracy

| ID | Zatwierdzona decyzja |
| --- | --- |
| D001 | ejsymont.com jest główną domeną projektu. |
| D002 | Wiesieke/architekt-mentor jest głównym repozytorium. |
| D003 | Hosting produkcyjny pozostaje na Vercel. |
| D004 | Portal ma edycje EN i PL z zachowaniem istniejących polskich adresów. |
| D005 | English jest strategicznie główną edycją. |
| D006 | Charakter edukacyjny i praktyczny. |
| D007 | Rzeczywiste przypadki tylko po anonimizacji. |
| D008 | Fikcja i scenariusze złożone są jawnie oznaczane. |
| D009 | OpenAI Responses API dla komentarzy, mentora i HLD; migracja wdrożona 1 października 2026 r. |
| D010 | Scoring ocenia rozumowanie, nie zgodność z jednym wzorcem. |
| D011 | Mentor rozwija sposób myślenia zamiast tylko egzaminować. |
| D012 | Nowości tylko przy istotnym temacie. |
| D013 | Pozycjonowanie jako magazyn decyzji architektonicznych. |
| D014 | Przypadek, pytania, analiza i ADR jako preferowany format. |
| D015 | Ograniczamy ręczne kopiowanie treści newslettera. |
| D016 | Jakość i wiarygodność przed liczbą publikacji. |
| D017 | Nie przypisujemy autorowi fikcyjnych doświadczeń i wyników. |
| D018 | MailerLite obsługuje subskrypcje; newsletter i komentarze są niezależne. |
| D019 | AI sprawdza nowe komentarze przed publikacją; niepewne trafiają do moderatora. |
| D020 | Nowe komentarze bez obowiązkowego potwierdzenia e-maila; wdrożone 1 października 2026 r. |
| D021 | Nowe ćwiczenia mają dwa przełączalne warianty: szybki i z mentorem, po polsku i angielsku. |
| D022 | Poziom łatwy lub średni; jeden cel, trzy kryteria mentora, maksymalnie 6 punktów. |
| D023 | Dokładna etykieta: Scenariusz edukacyjny inspirowany praktyką; bez dopisku o zmienionych szczegółach. |
| D024 | Każde ćwiczenie prowadzi do konkretnego materiału Ucz się o wzorcu lub technice i jej granicach. |
| D025 | Stały szablon redakcyjny i techniczny w docs/exercise-template.md; stałe adresy wszystkich ćwiczeń. |
| D026 | Wybór odpowiedzi daje wyjaśnienie bez AI. Zmiana wariantu zachowuje szkic, a fokus po pytaniu mentora trafia na odpowiedź mentora. |

## Instrukcja do kolejnego wątku

Wczytaj Master Context v5 oraz najnowszy Working Context. Przed pracą techniczną sprawdź aktualny stan repozytorium i produkcji. Oddzielaj kierunek docelowy, gotowy kod i wdrożenie. Twórz nowe ćwiczenia według szablonu docs/exercise-template.md oraz zasad opisanych w tym dokumencie. Nowe trwałe ustalenia wpisuj do Master Context, a postęp i blokady do Working Context.

Podstawa aktualizacji: dokumenty v1 i v2, ustalenia tego wątku, kod i wdrożenia z 1 października 2026 r. Trzy ćwiczenia w dwóch wariantach opublikowano przez PR #31. Commit produkcyjny: 7e9fc3e823fa1a741f2232b76437d23f5024c8fa. Vercel: dpl_4J8XSmAPPQsEW8ZCBb2pnz3SobMQ, stan READY, domena ejsymont.com. Osobny szkic biografii i README w PR #30 pozostaje poza tym wdrożeniem. Migrację OpenAI opublikowano przez PR #32; historyczny commit migracji: 652052f74c2ab6c0d845c954243e9458dc7a6d0a. Błąd odczytu oceny obsługujemy przez wymuszony schemat odpowiedzi, walidację oraz diagnostykę bez treści odpowiedzi i kluczy. Aktualizacja 2 października: PR #35, oficjalne źródła wydarzeń i zatwierdzenie publikacji pilotażu przez Wiesława. Bieżący stan wyznacza main w repozytorium.

## Architektura IT w dobie AI

Sekcja jest dostępna pod /architektura-it-ai/ oraz /en/architecture-with-ai/. Podtytuł: Jak architekt pracuje z AI / How an architect works with AI. Pierwszy tutorial pokazuje przegląd HLD wygenerowanego przez AI: założenia, warianty, diagramy, odpowiedzialności i dowody. Źródła treści oraz szablon docs/ai-tutorial-template.md znajdują się w GitHubie.

Rytm: jeden tutorial tygodniowo. Kolejne tematy mają pokazywać konkretną współpracę architekta z AI, wejście i wynik, niezależny przegląd oraz małe zadanie czytelnika. Rozróżniamy poprawne renderowanie diagramu od poprawności architektury. Nie zwiększamy trudności bez potrzeby.

## Pilotaż wydarzeń Warto wziąć udział

Wiesław zatwierdził 2 października 2026 publikację sekcji na produkcji oraz zapis w GitHubie i MasterContext. Adresy: https://ejsymont.com/wydarzenia/ oraz https://ejsymont.com/en/events/. Sekcja uzupełnia codzienne wydanie, nie zastępuje go i sama nie wysyła newslettera.

### Selekcja i niezależność

Pierwsze cztery wpisy PL/EN: InfoQ Certified Architect Program od 9 października, Generative AI for Software Architecture Diagrams 15 października, JDD 20–21 października w Krakowie oraz From Tokens to Features 29 października. Trzy wydarzenia są online. Oficjalne źródła sprawdzono 2 października. Niepotwierdzone ceny, godziny i języki są oznaczone wprost, nigdy zgadywane.

Program organizatora i niezależna rekomendacja ArchitectMentor są oddzielone. Każda karta wyjaśnia dla kogo jest wydarzenie i jak jego temat pomaga podejmować decyzje. Sponsor Harness dotyczy wydarzenia InfoQ, nie magazynu. Przyszłe partnerstwa medialne, sponsorowanie i afiliacja wymagają jawnych oznaczeń; nie zakładamy przychodów.

### Wdrożenie i utrzymanie

Treści są zapisane w data/events.json; widok PL/EN korzysta z jednego wspólnego komponentu. Nawigacja, obie strony główne i sitemap prowadzą do sekcji. Filtry obejmują format i miejsce, koszt oraz nadchodzące wydarzenia lub archiwum. Materiały pozostają dostępne po zakończeniu.

W przeglądarce terminy są przeliczane co minutę. Przy potwierdzonym endAt wydarzenie wygasa po tej chwili; przy znanej strefie i samym dniu końcowym stosujemy redakcyjną regułę końca ostatniego dnia. Brak strefy oznacza wymagający weryfikacji miniony termin, a nie potwierdzoną godzinę zakończenia. Odwołane i przełożone wydarzenia mają osobne statusy. Stare rekordy nie pokazują przycisku rejestracji.

Źródła sprawdzamy co tydzień oraz 72 i 24 godziny przed wydarzeniem i przed zmianą puli cenowej. Karta pokazuje datę sprawdzenia, a po 7 dniach komunikat o zaległej weryfikacji. Nie ma automatycznego odczytu i zatwierdzania zmian stron organizatorów: pozostaje to zadaniem redakcyjnym. Sprawdzenie konkretnych danych sesji ma pierwszeństwo nad skróconą listą wydarzeń.

### Plan i pomiar

Pilotaż obejmuje 2–29 października: 4 wpisy w pierwszym tygodniu, następnie 3–5 nowych wpisów tygodniowo. Para PL/EN liczy się jako jeden wpis; aktualizacja nie jest nowym wydarzeniem. Jakość ma pierwszeństwo przed limitem. Plan, szablon i kolejka sprawdzeń: docs/events-pilot.md. Nie utworzono osobnego nowego harmonogramu automatycznej publikacji wydarzeń w tym wdrożeniu.

Endpoint /api/event-interest zapisuje w logach Vercel tylko identyfikator wydarzenia, język i rodzaj działania: wyświetlenie karty, szczegóły, kliknięcie organizatora, materiału lub zainteresowania. Nie dodajemy identyfikatora odwiedzającego, e-maila, nazwy ani swobodnego tekstu i nie ustawiamy cookies pomiarowych. Hosting może prowadzić własne metadane żądań.

Pierwszy pomiar liczy działania, nie unikalne osoby, rejestracje ani faktyczny udział. Brak trwałej bazy statystyk i dashboardu. Logi trzeba pobierać do tygodniowego przeglądu w granicach retencji planu hostingu; nie zakładamy dostępu do pełnych 4 tygodni. Po pilotażu oceniamy zainteresowanie, jakość informacji, korekty i czas redakcji. Dopiero potem rozważamy trwałe agregaty i jawne partnerstwa.


## Zasady jakości zatwierdzone 2 października 2026

Obowiązuje docs/editorial-policy.md. Codzienny rytm dotyczy przygotowania szkiców, a publikacja wymaga osobistego przeglądu konkretnego materiału i zatwierdzenia danej wersji przez Wiesława. Ta zasada zastępuje wcześniejsze ogólne upoważnienie do automatycznego scalania wydań i tutoriali. Automatyzacje pozostawiają draft PR oraz zestawienie źródeł, kontroli i niewiadomych. AI nie może podpisać się jako ludzki recenzent. Merytoryczna zmiana po akceptacji wymaga ponownego przeglądu.

Każdy materiał musi wnosić konkretną wartość edukacyjną. Weryfikujemy źródła pierwotne, pochodzenie przykładu, fakty, daty, anonimizację, równoważność PL/EN, diagramy i działanie ćwiczeń. Nie wymyślamy doświadczeń autora, źródeł ani wyników testów. Etykieta „inspirowany praktyką” wymaga potwierdzonego źródła; bez niego stosujemy jawne oznaczenie scenariusza fikcyjnego albo modelowego. Poprawiamy istniejące materiały zamiast powielać treści. Brak minimalnej liczby publikacji; jakość ma pierwszeństwo przed kalendarzem.

Publiczny opis zasad: /jak-powstaja-materialy/ oraz /en/editorial-policy/. Oznaczenie przeglądu dodajemy tylko po rzeczywistym zatwierdzeniu. Starszych publikacji nie oznaczamy wstecz jako zweryfikowanych; ich przegląd pozostaje zadaniem do wykonania. Wyniki generatora HLD są projektami do przeglądu użytkownika, nie zatwierdzonymi architekturami. Plan pilotażu wydarzeń pozostaje w dokumentacji, a cytowany blok operacyjny usunięto z publicznych stron PL/EN.

Aktualizacja generatora HLD z 2 października: limit funkcji 300 s, wywołania OpenAI 270 s, początkowy budżet pełnego HLD 12 000 tokenów (mini 8 000), licznik czasu i jawne błędy timeout/truncation. Test fikcyjnego pełnego HLD z Sol zakończył się HTTP 200 po 158,5 s, z dwoma diagramami. To dowód działania jednego wywołania, nie gwarancja poprawności architektonicznej każdego wyniku.

Przegląd dla Wiesława: podsumowanie wydania zawiera czytelny podgląd Vercel Preview, draft PR, wersję/commit, pary PL/EN, źródła i krótką listę pytań do przeglądu. Wiesław czyta podgląd i akceptuje konkretną wersję w rozmowie lub PR; może zgłosić korekty albo zatwierdzić tylko nazwane materiały. Publikujemy wyłącznie zatwierdzony zakres. Niedostępny podgląd wymaga czytelnego szkicu jako zastępstwa, nie linku do starej produkcji.

## Wspólna strona główna PL/EN — 2 października 2026

Obie edycje korzystają z src/components/Homepage.astro: jeden układ, style, kolejność sekcji i mechanizm linków. src/pages/pl/index.astro oraz src/pages/en/index.astro są jedynie wrapperami z locale. Teksty znajdują się w src/data/homepage-copy.json, a treści i adresy w src/data/homepage.ts. PolishHomepage.astro jest wrapperem zgodności, nie osobnym układem.

Do PL przeniesiono kierunek UX z PR #37: główne działanie prowadzi do ćwiczenia, drugi link do wspólnej sekcji #start („Zacznij tutaj” / „Start here”), karta ćwiczeń jest wyróżniona. Lista najnowszych materiałów obu edycji wynika z editions.ts i latestEditionDate; EN korzysta z tłumaczeń artykułów, antywzorców i ćwiczeń. Brak tłumaczenia blokuje build, zamiast pomijać pozycję. Nie wpisujemy daty ani liczby materiałów na sztywno w stronach. Zachowujemy istniejące adresy PL/EN, przełącznik języka i biografię, bez scalania niezatwierdzonego PR #30. Zmiany układu wykonujemy wyłącznie we wspólnym komponencie; przy wydaniu aktualizujemy indeks i źródła treści, nie zastępujemy wrapperów osobnymi stronami.
