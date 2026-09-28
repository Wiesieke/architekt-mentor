import postgresql from '../content/articles/postgresql-19-beta4.html?raw';
import otel from '../content/articles/otel-k8s.html?raw';
import platforma from '../content/articles/platforma.html?raw';
import gateway from '../content/articles/gateway.html?raw';
import bulkhead from '../content/articles/bulkhead.html?raw';

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
];
export const articleUrl = (article: Pick<Article,'section'|'slug'>) => `/${article.section}/${article.slug}/`;
