import postgresql from '../content/articles/en/postgresql-19-beta4.html?raw';
import otel from '../content/articles/en/otel-k8s.html?raw';
import platforma from '../content/articles/en/platforma.html?raw';
import gateway from '../content/articles/en/gateway.html?raw';
import bulkhead from '../content/articles/en/bulkhead.html?raw';
import opis from '../content/articles/en/opis.html?raw';
import c4 from '../content/articles/en/c4.html?raw';
import adr from '../content/articles/en/adr.html?raw';
import ramy from '../content/articles/en/ramy.html?raw';
import wzorce from '../content/articles/en/wzorce.html?raw';
import checklista from '../content/articles/en/checklista.html?raw';
import slo from '../content/articles/en/slo-error-budget.html?raw';
import qualityScenarios from '../content/articles/en/quality-attribute-scenarios.html?raw';
import type { Article } from './articles';

export type EnglishArticle = Omit<Article, 'section' | 'slug'> & { section: 'architecture-in-motion' | 'foundations'; slug: string; plSlug: string };

export const englishArticles: EnglishArticle[] = [
  { section:'foundations', slug:'quality-attribute-scenarios', plSlug:'scenariusze-atrybutow-jakosciowych', title:'Quality-attribute scenarios: from adjective to measure', description:'Turn “fast, secure and easy to change” into a testable requirement that guides an architecture decision.', topic:'Quality attributes', published:'2026-09-29', body:qualityScenarios },
  { section:'foundations', slug:'slo-error-budget', plSlug:'slo-budzet-bledow', title:'SLOs and error budgets: from measurement to decisions', description:'Define an SLI for a user journey, calculate an error budget and use it to guide an architecture decision.', topic:'Reliability', published:'2026-09-28', body:slo },
  { section:'architecture-in-motion', slug:'postgresql-19-beta4', plSlug:'postgresql-19-beta4', title:'PostgreSQL 19 Beta 4: features removed before release', description:'Which features were removed from PostgreSQL 19 Beta 4, and what does that mean for a migration decision?', topic:'Databases', published:'2026-09-28', eventDate:'2026-09-24', body:postgresql },
  { section:'architecture-in-motion', slug:'otel-k8s', plSlug:'otel-k8s', title:'OpenTelemetry: Kubernetes attributes processor reaches 1.0', description:'Stable Kubernetes attributes and the migration questions behind consistent telemetry.', topic:'Observability', eventDate:'2026-09-16', body:otel },
  { section:'architecture-in-motion', slug:'platform-contracts', plSlug:'platforma', title:'A self-service platform also needs contracts between teams', description:'Why an internal platform needs clear ownership and interfaces alongside templates.', topic:'Platform engineering', eventDate:'2026-09-01', body:platforma },
  { section:'architecture-in-motion', slug:'gateway-api-v1-6', plSlug:'gateway', title:'Gateway API v1.6: stable TCP and UDP routes', description:'What stable TCPRoute and UDPRoute mean for Kubernetes network design.', topic:'Integration and networking', eventDate:'2026-08-03', body:gateway },
  { section:'foundations', slug:'bulkhead', plSlug:'bulkhead', title:'Bulkhead: isolate resources that can be exhausted', description:'The bulkhead pattern: failure boundaries, separate resource limits and their trade-offs.', topic:'Resilience patterns', published:'2026-09-28', body:bulkhead },
  { section:'foundations', slug:'architecture-description', plSlug:'opis', title:'What does an architect describe?', description:'Goals, stakeholders, scenarios and quality concerns as the starting point for an architecture description.', topic:'Architecture descriptions', body:opis },
  { section:'foundations', slug:'c4', plSlug:'c4', title:'C4: show the system at the right level', description:'Context, containers, components and code: which views support a decision?', topic:'C4 model', body:c4 },
  { section:'foundations', slug:'adr', plSlug:'adr', title:'ADR: a record of consequential decisions', description:'Record the context, decision, alternatives and consequences in an ADR.', topic:'Architecture decisions', body:adr },
  { section:'foundations', slug:'frameworks-and-models', plSlug:'ramy', title:'Standards, methods, languages and models serve different purposes', description:'Where ISO 42010, TOGAF, ArchiMate, C4 and ADR can help.', topic:'Frameworks and languages', body:ramy },
  { section:'foundations', slug:'architecture-patterns', plSlug:'wzorce', title:'Apply patterns to specific risks', description:'Retry, circuit breaker and transactional outbox in the context of risk and cost.', topic:'Architecture patterns', body:wzorce },
  { section:'foundations', slug:'hld-review-checklist', plSlug:'checklista', title:'Five questions before an HLD review', description:'A short checklist for discussing goals, facts, risk and validation.', topic:'Architecture review', body:checklista },
];

export const englishArticleUrl = (article: Pick<EnglishArticle, 'section' | 'slug'>) => `/en/${article.section}/${article.slug}/`;
export const polishArticleUrl = (article: Pick<EnglishArticle, 'section' | 'plSlug'>) => `/${article.section === 'foundations' ? 'podstawy-architektury' : 'architektura-w-ruchu'}/${article.plSlug}/`;
export const englishUrlForPolishArticle = (section: Article['section'], slug: string) => {
  const translated = englishArticles.find(article => article.plSlug === slug && article.section === (section === 'podstawy-architektury' ? 'foundations' : 'architecture-in-motion'));
  return translated ? englishArticleUrl(translated) : undefined;
};
