// Editorial index for the prototype. Dates mark publication on this site,
// not the date when the technology described in an article was announced.
export const editions = [
  { kind: 'ĆWICZENIE', published: '2026-09-29', title: 'Dwie wersje aplikacji, jeden schemat. Jak wdrożysz zmianę bez przestoju?', summary: 'Scenariusz · pytanie mentora · kryteria oceny', href: '/lamiglowka/' },
  { kind: 'ANTYWZORZEC', published: '2026-09-29', title: 'Migracja schematu w jednym kroku', summary: 'Objawy · konsekwencje · lepsza decyzja', href: '/antywzorce/2026-09-29-migracja-schematu-jeden-krok/' },
  { kind: 'PODSTAWY', published: '2026-09-29', title: 'Scenariusz jakościowy: od przymiotnika do miary', summary: 'Bodziec · środowisko · reakcja · miara', href: '/podstawy-architektury/scenariusze-atrybutow-jakosciowych/' },
  { kind: 'PODSTAWY', published: '2026-09-28', title: 'SLO i budżet błędów: od pomiaru do decyzji', summary: 'SLI · przykład liczbowy · fragment ADR', href: '/podstawy-architektury/slo-budzet-bledow/' },
  { kind: 'ĆWICZENIE', published: '2026-09-28', title: 'Raport blokuje składanie zamówień. Co izolujesz?', summary: 'Scenariusz · pytanie mentora · kryteria oceny', href: '/lamiglowka/' },
  { kind: 'ANTYWZORZEC', published: '2026-09-28', title: 'Jedna pula dla wszystkich zależności', summary: 'Objawy · konsekwencje · sposób naprawy', href: '/antywzorce/2026-09-wspolna-pula-zaleznosci/' },
  { kind: 'W RUCHU', published: '2026-09-28', eventDate: '2026-09-24', title: 'PostgreSQL 19 Beta 4: funkcje wycofane przed wydaniem', summary: 'Data wydarzenia: 24.09 · fakt · znaczenie dla projektu', href: '/architektura-w-ruchu/postgresql-19-beta4/' },
  { kind: 'PODSTAWY', published: '2026-09-28', title: 'Bulkhead: izoluj zasoby, które mogą się wyczerpać', summary: 'Wzorzec · przykład · kompromis', href: '/podstawy-architektury/bulkhead/' },
] as const;

export const latestEditionDate = editions.reduce((latest, item) => item.published > latest ? item.published : latest, '');
