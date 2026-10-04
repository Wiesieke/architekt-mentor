# Learning catalogue

Both locale pages use LearningCatalogue.astro and learning.ts. Article URLs and content remain unchanged.

Six controlled, extensible areas replace grouping by inconsistent free-text topic labels. Every Polish foundation slug must belong to exactly one area; its English pair is required. Build fails if either is missing. Assign new articles before release; add an area only for a distinct learning need with enough material, rather than for each topic label.

Newest dated article is highlighted; areas are ordered by their newest article and cards by publication date descending. Undated older material comes last; no invented dates. Equal dates preserve registry order.

Search combines all words across title, description, topic and area. It ignores case and diacritics (including Polish ł), combines with area filter, announces result count and supports reset. It does not search full article bodies or call an external service. Without JavaScript all grouped article links remain readable and controls stay hidden.

Human review of the catalogue presentation is pending. This UX proposal is separate from approved PR #42.
