# Learning catalogue

Both locale pages use LearningCatalogue.astro and learning.ts. Article URLs and content remain unchanged.

Six controlled, extensible areas replace grouping by inconsistent free-text topic labels. Every Polish foundation slug must belong to exactly one area; its English pair is required. Build fails if either is missing. Assign new articles before release; add an area only for a distinct learning need with enough material, rather than for each topic label.

Newest dated article is highlighted; areas are ordered by their newest article and cards by publication date descending. Undated older material comes last; no invented dates. Equal dates preserve registry order.

Search combines all words across title, description, topic and area. It ignores case and diacritics (including Polish ł), combines with area filter, announces result count and supports reset. It does not search full article bodies or call an external service. Without JavaScript all grouped article links remain readable and controls stay hidden.

Human review of the catalogue presentation is pending. This UX proposal is separate from approved PR #42.


## Expanded catalogue UX

The same component serves foundations, exercise archives, anti-patterns, in-motion archives and AI tutorials in PL/EN. Native details/summary controls give keyboard-accessible collapsible groups; newest group starts open. Search/group/level filters expand matching groups and hide zero-result groups. Reset restores initial open state. Topic labels remain on cards; avoid singleton nested folders. Add genuine subgroups when catalogue density justifies them.

Explicit exercise/anti-pattern ID assignments in catalogue.ts fail build on missing classification or translation. Exercise level filter does not change mentor scoring. News weeks use publication date, falling back to event date for legacy entries; this fallback is disclosed. No fake publication dates.

PortalSearch on the shared homepage searches the current locale's article, exercise and anti-pattern catalogue. It covers title, summary and topic rather than full article bodies; case/accent insensitive, all terms required. Filter by material type; eight matches initially, Show more adds eight. No request to an external search provider, no user brief or comment indexing. Article URLs unchanged.

This work adds navigation only. Exercise scenarios, origins, source claims and mentoring APIs remain unchanged. Real examples require a confirmed source, author review and confidentiality assessment; do not invent first-hand AI experience.
