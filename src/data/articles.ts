import retryBudget from '../content/articles/retry-budget-jeden-wlasciciel.html?raw';
import replicaDecision from '../content/articles/czy-potrzebujemy-repliki-danych.html?raw';
import conditionalApproval from '../content/articles/warunkowa-decyzja-architektoniczna.html?raw';
import weeklyAI from '../content/articles/hld-z-dokumentacji-dostawcy.html?raw';
import weeklyFoundation from '../content/articles/due-diligence-saas.html?raw';
import weeklyMesh from '../content/articles/cloud-service-mesh-koniec-istiod.html?raw';
import installationTokens from '../content/articles/github-tokeny-instalacyjne-format.html?raw';
import apiEvolution from '../content/articles/ewolucja-kontraktu-api.html?raw';
import asyncNotifications from '../content/articles/komunikacja-asynchroniczna-powiadomienia.html?raw';
import macos14 from '../content/articles/github-actions-macos-14-wycofanie.html?raw';
import aiReview from '../content/articles/hld-ai-przeglad.html?raw';
import starterLearning0 from '../content/articles/analiza-wplywu-zmiany.html?raw';
import starterLearning1 from '../content/articles/idempotencja-lookup-kompensacja.html?raw';
import starterLearning2 from '../content/articles/graceful-degradation.html?raw';
import checksums from '../content/articles/cloud-storage-domyslne-sumy-kontrolne.html?raw';
import tenantIsolation from '../content/articles/izolacja-tenantow-niezmiennik.html?raw';
import streaming from '../content/articles/google-api-gateway-streaming.html?raw';
import recovery from '../content/articles/rpo-rto-proba-odtworzenia.html?raw';
import postgresql from '../content/articles/postgresql-19-beta4.html?raw';
import otel from '../content/articles/otel-k8s.html?raw';
import platforma from '../content/articles/platforma.html?raw';
import gateway from '../content/articles/gateway.html?raw';
import bulkhead from '../content/articles/bulkhead.html?raw';
import opis from '../content/articles/opis.html?raw';
import c4 from '../content/articles/c4.html?raw';
import adr from '../content/articles/adr.html?raw';
import ramy from '../content/articles/ramy.html?raw';
import wzorce from '../content/articles/wzorce.html?raw';
import checklista from '../content/articles/checklista.html?raw';
import slo from '../content/articles/slo-budzet-bledow.html?raw';
import qualityScenarios from '../content/articles/scenariusze-atrybutow-jakosciowych.html?raw';

import type { AuthorId } from './authors';
export interface Article {
  section: 'architektura-w-ruchu' | 'podstawy-architektury' | 'architektura-it-ai';
  slug: string;
  title: string;
  description: string;
  topic: string;
  published?: string; // On-site date, never substitute the technology event date.
  eventDate?: string;
  authorId: AuthorId;
  body: string;
}
export const articles: Article[] = [
  { section:'podstawy-architektury', slug:'retry-budget-jeden-wlasciciel', title:'Czy retry pogłębia przeciążenie? Jeden właściciel ponowień', description:'Dlaczego 3 × 3 próby mogą przeciążyć katalog i jak ustalić wspólny budżet prób, deadline i testy 429/503.', topic:'Odporność, integracje i retry', published:'2026-10-16', authorId:'wieslaw-ejsymont', body:retryBudget },
  { section:'podstawy-architektury', slug:'czy-potrzebujemy-repliki-danych', title:'Czy naprawdę potrzebujemy repliki danych?', description:'Od pomiarów i świeżości danych do decyzji: optymalizacja, replika odczytowa czy przełączenie awaryjne.', topic:'Dane, dostępność i spójność', published:'2026-10-14', authorId:'wieslaw-ejsymont', body:replicaDecision },
  { section:'podstawy-architektury', slug:'warunkowa-decyzja-architektoniczna', title:'Decyzja warunkowa to nie zgoda na wdrożenie. Jak zamknąć warunki?', description:'Sześć pól warunku: kryterium, właściciel, dowód, weryfikator, bramka i działanie po niepowodzeniu.', topic:'Ład architektoniczny i decyzje', published:'2026-10-13', authorId:'wieslaw-ejsymont', body:conditionalApproval },
{"section":"architektura-it-ai","slug":"hld-z-dokumentacji-dostawcy","title":"AI napisało HLD z dokumentów dostawcy. Co wiemy, a co dopowiedziało?","description":"Tutorial 02: rejestr źródeł, jawne niewiadome, pytania zmieniające projekt i weryfikacja stwierdzeń.","topic":"Tutorial 02 · źródła i HLD","body":weeklyAI,"published":"2026-10-11"},
{"section":"podstawy-architektury","slug":"due-diligence-saas","title":"Przegląd architektoniczny SaaS przed zakupem: co musi wiedzieć klient?","description":"Siedem obszarów oceny oraz macierz odpowiedzialność → wymaganie → dowód.","topic":"SaaS i odpowiedzialność","body":weeklyFoundation,"published":"2026-10-11"},
{"section":"architektura-w-ruchu","slug":"cloud-service-mesh-koniec-istiod","title":"Cloud Service Mesh kończy wsparcie ISTIOD: zaplanuj migrację granic","description":"Termin 1 marca 2028, dwa warianty migracji i dowody przed przeniesieniem ruchu.","topic":"Kubernetes i cykl życia","eventDate":"2026-09-28","body":weeklyMesh,"published":"2026-10-11"},
  { section:'architektura-w-ruchu', slug:'github-tokeny-instalacyjne-format', title:'GitHub zmienił format tokenów: sprawdź całą ścieżkę poświadczenia', description:'Dłuższy token instalacyjny może ujawnić limity magazynu, proxy i reguł maskowania. Plan sprawdzenia integracji bez ujawniania sekretów.', topic:'Integracja i bezpieczeństwo', published:'2026-10-04', eventDate:'2026-10-02', authorId:'wieslaw-ejsymont', body:installationTokens },
  { section:'podstawy-architektury', slug:'ewolucja-kontraktu-api', title:'Ewolucja kontraktu API: zgodność trzeba udowodnić', description:'Dlaczego dodanie opcjonalnego pola do odpowiedzi API może zakłócić działanie aplikacji, która z niego korzysta? Jak sprawdzić zgodność źródłową, zgodność formatu przesyłanych danych oraz zgodność semantyczną?', topic:'API i kompatybilność', published:'2026-10-03', authorId:'wieslaw-ejsymont', body:apiEvolution },
  {section:'architektura-it-ai',slug:'hld-ai-przeglad',title:'AI wygenerowało HLD — jak sprawdzić, czy jest użyteczne?',description:'Tutorial: od briefu i pytań do kontrprzykładu, diagramu, testu awarii i ADR.',topic:'Tutorial 01 · przegląd HLD',published:'2026-10-02',authorId:'wieslaw-ejsymont', body:aiReview},
  { section:'podstawy-architektury', slug:'komunikacja-asynchroniczna-powiadomienia', title:'Komunikacja asynchroniczna: oddziel zamówienie od powiadomienia', description:'Jak trwale zapisać pomocniczą pracę, ponawiać właściwy krok i nie utworzyć duplikatu operacji biznesowej.', topic:'Integracja i odporność', published:'2026-10-02', authorId:'wieslaw-ejsymont', body:asyncNotifications },
  { section:'architektura-w-ruchu', slug:'github-actions-macos-14-wycofanie', title:'GitHub Actions wycofuje macOS 14: CI też ma cykl życia', description:'Wycofanie 2 listopada i październikowe brownouty wymagają testu całego łańcucha budowania, podpisywania i publikacji.', topic:'CI/CD i cykl życia', published:'2026-10-02', eventDate:'2026-10-01', authorId:'wieslaw-ejsymont', body:macos14 },
  { section:'podstawy-architektury', slug:"analiza-wplywu-zmiany", title:"Analiza wpływu zmiany: sprzęt, aplikacja i granice systemu", description:"Jak sprawdzić zgodność i dobrać zakres przeglądu do rzeczywistej zmiany.", topic:"Technika analizy", published:'2026-10-01', authorId:'wieslaw-ejsymont', body:starterLearning0 },
  { section:'podstawy-architektury', slug:"idempotencja-lookup-kompensacja", title:"Idempotencja, lookup i kompensacja: trzy różne zadania", description:"Bezpieczne ponowienia i decyzje przy nieznanym wyniku operacji.", topic:"Wzorce integracji", published:'2026-10-01', authorId:'wieslaw-ejsymont', body:starterLearning1 },
  { section:'podstawy-architektury', slug:"graceful-degradation", title:"Graceful degradation: zachowaj główną funkcję", description:"Kiedy awaria dodatku nie powinna blokować wyniku i gdzie leży granica.", topic:"Odporność", published:'2026-10-01', authorId:'wieslaw-ejsymont', body:starterLearning2 },
  { section:'architektura-w-ruchu', slug:'cloud-storage-domyslne-sumy-kontrolne', title:'Cloud Storage: sumy kontrolne domyślnie w bibliotekach', description:'Zmiana z 30 września chroni integralność transferu, ale ma ograniczenia dla odczytów zakresowych i złożonych uploadów.', topic:'Dane i niezawodność', published:'2026-10-01', eventDate:'2026-09-30', authorId:'wieslaw-ejsymont', body:checksums },
  { section:'podstawy-architektury', slug:'izolacja-tenantow-niezmiennik', title:'Izolacja tenantów jako niezmiennik całej ścieżki', description:'Jak przenieść zaufany kontekst klienta przez autoryzację, dane, cache, wyszukiwanie i zadania asynchroniczne.', topic:'Bezpieczeństwo i wielodostępność', published:'2026-10-01', authorId:'wieslaw-ejsymont', body:tenantIsolation },
  { section:'architektura-w-ruchu', slug:'google-api-gateway-streaming', title:'Google Cloud API Gateway: strumieniowanie zmienia projekt API', description:'Public Preview z 29 września: SSE, WebSocket i gRPC przez bramę, ale też ograniczenia domen, terminów i migracji.', topic:'API i AI', published:'2026-09-30', eventDate:'2026-09-29', authorId:'wieslaw-ejsymont', body:streaming },
  { section:'podstawy-architektury', slug:'rpo-rto-proba-odtworzenia', title:'RPO, RTO i próba odtworzenia całej usługi', description:'Jak rozdzielić utratę danych od czasu odtworzenia i zmierzyć oba cele na pełnej ścieżce użytkownika.', topic:'Odporność i odtwarzanie', published:'2026-09-30', authorId:'wieslaw-ejsymont', body:recovery },
  { section:'podstawy-architektury', slug:'scenariusze-atrybutow-jakosciowych', title:'Scenariusz jakościowy: od przymiotnika do miary', description:'Jak zamienić „szybki, bezpieczny i łatwy do zmiany” w sprawdzalne wymaganie, które prowadzi do decyzji architektonicznej.', topic:'Atrybuty jakościowe', published:'2026-09-29', authorId:'wieslaw-ejsymont', body:qualityScenarios },
  { section:'podstawy-architektury', slug:'slo-budzet-bledow', title:'SLO i budżet błędów: od pomiaru do decyzji', description:'Jak zdefiniować SLI dla ścieżki użytkownika, policzyć budżet błędów i wykorzystać go w decyzji architektonicznej.', topic:'Niezawodność', published:'2026-09-28', authorId:'wieslaw-ejsymont', body:slo },
  { section:'architektura-w-ruchu', slug:'postgresql-19-beta4', title:'PostgreSQL 19 Beta 4: funkcje wycofane przed wydaniem', description:'Które funkcje PostgreSQL 19 wycofano z bety i co to oznacza dla decyzji o migracji? Fakty, źródła i pytanie do projektu.', topic:'Bazy danych', published:'2026-09-28', eventDate:'2026-09-24', authorId:'wieslaw-ejsymont', body:postgresql },
  { section:'architektura-w-ruchu', slug:'otel-k8s', title:'OpenTelemetry: stabilny procesor atrybutów Kubernetes', description:'Stabilizacja k8sattributes i znaczenie spójnych atrybutów telemetrii dla architektury i monitoringu.', topic:'Obserwowalność', eventDate:'2026-09-16', authorId:'wieslaw-ejsymont', body:otel },
  { section:'architektura-w-ruchu', slug:'platforma', title:'Platforma samoobsługowa to także umowy między zespołami', description:'Dlaczego platforma wewnętrzna wymaga kontraktów i właścicieli, a nie tylko portalu z szablonami.', topic:'Platform engineering', eventDate:'2026-09-01', authorId:'wieslaw-ejsymont', body:platforma },
  { section:'architektura-w-ruchu', slug:'gateway', title:'Gateway API v1.6: stabilne trasy TCP i UDP', description:'Co stabilne TCPRoute i UDPRoute oznaczają dla projektowania sieci i integracji w Kubernetes.', topic:'Integracja i sieć', eventDate:'2026-08-03', authorId:'wieslaw-ejsymont', body:gateway },
  { section:'podstawy-architektury', slug:'bulkhead', title:'Bulkhead: izoluj zasoby, które mogą się wyczerpać', description:'Wzorzec bulkhead: granica awarii, osobne limity zasobów, przykład i kompromisy decyzji architektonicznej.', topic:'Wzorce odporności', published:'2026-09-28', authorId:'wieslaw-ejsymont', body:bulkhead },
  { section:'podstawy-architektury', slug:'opis', title:'Co właściwie opisuje architekt?', description:'Cel, interesariusze, scenariusze i jakości jako punkt wyjścia do opisu architektury.', topic:'Opis architektury', authorId:'wieslaw-ejsymont', body:opis },
  { section:'podstawy-architektury', slug:'c4', title:'C4: pokazuj system w odpowiedniej skali', description:'Kontekst, kontenery, komponenty i kod: które widoki pomagają podjąć decyzję?', topic:'Model C4', authorId:'wieslaw-ejsymont', body:c4 },
  { section:'podstawy-architektury', slug:'adr', title:'ADR: pamięć o ważnej decyzji', description:'Jak zwięźle zapisać kontekst, decyzję, warianty i konsekwencje w ADR.', topic:'Decyzje architektoniczne', authorId:'wieslaw-ejsymont', body:adr },
  { section:'podstawy-architektury', slug:'ramy', title:'Standard, metoda, język i model to różne narzędzia', description:'Gdzie przydają się ISO 42010, TOGAF, ArchiMate, C4 i ADR?', topic:'Ramy i języki', authorId:'wieslaw-ejsymont', body:ramy },
  { section:'podstawy-architektury', slug:'wzorce', title:'Wzorce: stosuj je do konkretnego ryzyka', description:'Retry, circuit breaker i transactional outbox w kontekście ryzyka oraz kosztów.', topic:'Wzorce architektoniczne', authorId:'wieslaw-ejsymont', body:wzorce },
  { section:'podstawy-architektury', slug:'checklista', title:'Pięć pytań przed przeglądem HLD', description:'Krótka lista kontrolna do rozmowy o celu, faktach, ryzyku i sposobie sprawdzenia projektu.', topic:'Przegląd architektury', authorId:'wieslaw-ejsymont', body:checklista },
];
export const articleUrl = (article: Pick<Article,'section'|'slug'>) => `/${article.section}/${article.slug}/`;
