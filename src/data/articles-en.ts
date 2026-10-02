import asyncNotifications from '../content/articles/en/asynchronous-notifications.html?raw';
import macos14 from '../content/articles/en/github-actions-macos-14-retirement.html?raw';
import aiReview from '../content/articles/en/review-ai-generated-hld.html?raw';
import starterLearning0 from '../content/articles/en/change-impact-analysis.html?raw';
import starterLearning1 from '../content/articles/en/idempotency-lookup-compensation.html?raw';
import starterLearning2 from '../content/articles/en/graceful-degradation.html?raw';
import checksums from '../content/articles/en/cloud-storage-default-checksums.html?raw';
import tenantIsolation from '../content/articles/en/tenant-isolation-invariant.html?raw';
import streaming from '../content/articles/en/google-api-gateway-streaming.html?raw';
import recovery from '../content/articles/en/rpo-rto-recovery-drill.html?raw';
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

export type EnglishArticle = Omit<Article, 'section' | 'slug'> & { section: 'architecture-in-motion' | 'foundations' | 'architecture-with-ai'; slug: string; plSlug: string };

export const englishArticles: EnglishArticle[] = [
  {section:'architecture-with-ai',slug:'review-ai-generated-hld',plSlug:'hld-ai-przeglad',title:'AI drafted an HLD — how do you check whether it is useful?',description:'Tutorial: from a brief and questions to a failure case, a diagram, verification and an ADR.',topic:'Tutorial 01 · HLD review',published:'2026-10-02',body:aiReview},
  { section:'foundations', slug:'asynchronous-notifications', plSlug:'komunikacja-asynchroniczna-powiadomienia', title:'Asynchronous communication: separate the order from its notification', description:'Durably record auxiliary work, retry the right step and avoid duplicating the business operation.', topic:'Integration and resilience', published:'2026-10-02', body:asyncNotifications },
  { section:'architecture-in-motion', slug:'github-actions-macos-14-retirement', plSlug:'github-actions-macos-14-wycofanie', title:'GitHub Actions retires macOS 14: CI has a lifecycle too', description:'The 2 November retirement and October brownouts call for testing the full build, signing and publication chain.', topic:'CI/CD and lifecycle', published:'2026-10-02', eventDate:'2026-10-01', body:macos14 },
  { section:'foundations', slug:"change-impact-analysis", plSlug:"analiza-wplywu-zmiany", title:"Change impact analysis: hardware, apps and system boundaries", description:"Check compatibility and scale the review to the actual change.", topic:'Practical decisions', published:'2026-10-01', body:starterLearning0 },
  { section:'foundations', slug:"idempotency-lookup-compensation", plSlug:"idempotencja-lookup-kompensacja", title:"Idempotency, lookup and compensation: three different jobs", description:"Safe retries and decisions when an operation has an unknown outcome.", topic:'Practical decisions', published:'2026-10-01', body:starterLearning1 },
  { section:'foundations', slug:"graceful-degradation", plSlug:"graceful-degradation", title:"Graceful degradation: preserve the core function", description:"When optional-feature failure should not block a result, and where the boundary lies.", topic:'Practical decisions', published:'2026-10-01', body:starterLearning2 },
  { section:'architecture-in-motion', slug:'cloud-storage-default-checksums', plSlug:'cloud-storage-domyslne-sumy-kontrolne', title:'Cloud Storage client libraries enable checksums by default', description:'The 30 September change improves transfer integrity, with limits for range reads and composite uploads.', topic:'Data and reliability', published:'2026-10-01', eventDate:'2026-09-30', body:checksums },
  { section:'foundations', slug:'tenant-isolation-invariant', plSlug:'izolacja-tenantow-niezmiennik', title:'Tenant isolation is an end-to-end invariant', description:'Carry trusted tenant context through authorisation, data, caches, search and asynchronous work.', topic:'Security and multitenancy', published:'2026-10-01', body:tenantIsolation },
  { section:'architecture-in-motion', slug:'google-api-gateway-streaming', plSlug:'google-api-gateway-streaming', title:'Google Cloud API Gateway: streaming changes API design', description:'The 29 September Public Preview adds SSE, WebSockets and gRPC streaming, with migration and domain constraints to weigh.', topic:'APIs and AI', published:'2026-09-30', eventDate:'2026-09-29', body:streaming },
  { section:'foundations', slug:'rpo-rto-recovery-drill', plSlug:'rpo-rto-proba-odtworzenia', title:'RPO, RTO and a full-service recovery drill', description:'Separate acceptable data loss from recovery time and measure both across the complete user journey.', topic:'Resilience and recovery', published:'2026-09-30', body:recovery },
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
export const polishArticleUrl = (article: Pick<EnglishArticle, 'section' | 'plSlug'>) => `/${article.section === 'foundations' ? 'podstawy-architektury' : article.section === 'architecture-with-ai' ? 'architektura-it-ai' : 'architektura-w-ruchu'}/${article.plSlug}/`;
export const englishUrlForPolishArticle = (section: Article['section'], slug: string) => {
  const translated = englishArticles.find(article => article.plSlug === slug && article.section === (section === 'podstawy-architektury' ? 'foundations' : section === 'architektura-it-ai' ? 'architecture-with-ai' : 'architecture-in-motion'));
  return translated ? englishArticleUrl(translated) : undefined;
};
