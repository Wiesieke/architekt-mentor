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

export interface Article {
  section: 'architektura-w-ruchu' | 'podstawy-architektury';
  slug: string;
  title: string;
  description: string;
  topic: string;
  published?: string; // On-site date, never substitute the technology event date.
  eventDate?: string;
  body: string;
}
export const articles: Article[] = [
  { section:'architektura-w-ruchu', slug:'postgresql-19-beta4', title:'PostgreSQL 19 Beta 4: funkcje wycofane przed wydaniem', description:'Które funkcje PostgreSQL 19 wycofano z bety i co to oznacza dla decyzji o migracji? Fakty, źródła i pytanie do projektu.', topic:'Bazy danych', published:'2026-09-28', eventDate:'2026-09-24', body:postgresql },
  { section:'architektura-w-ruchu', slug:'otel-k8s', title:'OpenTelemetry: stabilny procesor atrybutów Kubernetes', description:'Stabilizacja k8sattributes i znaczenie spójnych atrybutów telemetrii dla architektury i monitoringu.', topic:'Obserwowalność', eventDate:'2026-09-16', body:otel },
  { section:'architektura-w-ruchu', slug:'platforma', title:'Platforma samoobsługowa to także umowy między zespołami', description:'Dlaczego platforma wewnętrzna wymaga kontraktów i właścicieli, a nie tylko portalu z szablonami.', topic:'Platform engineering', eventDate:'2026-09-01', body:platforma },
  { section:'architektura-w-ruchu', slug:'gateway', title:'Gateway API v1.6: stabilne trasy TCP i UDP', description:'Co stabilne TCPRoute i UDPRoute oznaczają dla projektowania sieci i integracji w Kubernetes.', topic:'Integracja i sieć', eventDate:'2026-08-03', body:gateway },
  { section:'podstawy-architektury', slug:'bulkhead', title:'Bulkhead: izoluj zasoby, które mogą się wyczerpać', description:'Wzorzec bulkhead: granica awarii, osobne limity zasobów, przykład i kompromisy decyzji architektonicznej.', topic:'Wzorce odporności', published:'2026-09-28', body:bulkhead },
  { section:'podstawy-architektury', slug:'opis', title:'Co właściwie opisuje architekt?', description:'Cel, interesariusze, scenariusze i jakości jako punkt wyjścia do opisu architektury.', topic:'Opis architektury', body:opis },
  { section:'podstawy-architektury', slug:'c4', title:'C4: pokazuj system w odpowiedniej skali', description:'Kontekst, kontenery, komponenty i kod: które widoki pomagają podjąć decyzję?', topic:'Model C4', body:c4 },
  { section:'podstawy-architektury', slug:'adr', title:'ADR: pamięć o ważnej decyzji', description:'Jak zwięźle zapisać kontekst, decyzję, warianty i konsekwencje w ADR.', topic:'Decyzje architektoniczne', body:adr },
  { section:'podstawy-architektury', slug:'ramy', title:'Standard, metoda, język i model to różne narzędzia', description:'Gdzie przydają się ISO 42010, TOGAF, ArchiMate, C4 i ADR?', topic:'Ramy i języki', body:ramy },
  { section:'podstawy-architektury', slug:'wzorce', title:'Wzorce: stosuj je do konkretnego ryzyka', description:'Retry, circuit breaker i transactional outbox w kontekście ryzyka oraz kosztów.', topic:'Wzorce architektoniczne', body:wzorce },
  { section:'podstawy-architektury', slug:'checklista', title:'Pięć pytań przed przeglądem HLD', description:'Krótka lista kontrolna do rozmowy o celu, faktach, ryzyku i sposobie sprawdzenia projektu.', topic:'Przegląd architektury', body:checklista },
];
export const articleUrl = (article: Pick<Article,'section'|'slug'>) => `/${article.section}/${article.slug}/`;
