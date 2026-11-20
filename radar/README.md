# ArchitectMentor Radar — niezależny kolektor godzinowy v0.1

**Stan:** kod i migracja przygotowane do kontroli w PR. **Nie jest to dowód, że baza została utworzona, LH Cron działa lub źródła są włączone.**

## Granice projektu

- Osobny repozytorium, konto SQL, baza, prefiks tabel `amr_`, katalog prywatny, konfiguracja i zadanie Cron. Żadnych zależności od WRYCUT.
- Cel: radar „Architektura w ruchu” i monitoring oficjalnych zmian technicznych — tylko publiczne metadane RSS/Atom: tytuł, URL, data, nazwa źródła i temat. Nie pobierać pełnych artykułów, opisów, zdjęć.
- Nie wykorzystuje dokumentów ani danych pracodawcy. „Nowa informacja” nie oznacza jeszcze „warto publikować”.
- Wszystkie źródła startują z `enabled=0` i `rights_gate='needs_review'`. Aktywacja wymaga osobnej oceny praw i wiarygodności.
- SQL zawiera kolejkę decyzji `amr_decisions`: `UNREVIEWED`, `SELECTED`, `HOLD`, `REJECTED`, `REQUEST_RESEARCH`. **Żadne decyzje nie są zmieniane automatycznie**.
- W osobnym etapie dobudować panel czytelnika/redaktora, uprawnienia, API do ręcznej decyzji, dziennik audytowy. Tabela nie oznacza, że panel już istnieje.

## Konfiguracja LH.pl (wykonuje właściciel z bezpiecznym dostępem)

1. Utworzyć **nową**, dedykowaną ArchitectMentor bazę MySQL i konto o minimalnych uprawnieniach. Zanotować dokładny DB name, host, wersję DB. Upewnić się, że to nie WRYCUT.
2. Po kopii bezpieczeństwa i sprawdzeniu `SELECT DATABASE()` ręcznie uruchomić `radar/db/001_architectmentor_radar.sql` tylko w tej bazie.
3. W katalogu **poza** `public_html` skopiować `radar/lh/private/*.php` i utworzyć lokalny `config.private.php` z szablonu. Nigdy nie commitować haseł; pliki PHP nie mogą być serwowane przez WWW.
4. Uruchomić przez CLI `php doctor.php`: rozszerzenia, połączenie, tabele. Przy braku PHP CLI należy znaleźć bezpieczną metodę LH zgodną z planem, nie wystawiać publicznego workera.
5. Włączyć worker dopiero po ocenie źródeł, próbie lokalnej, zabezpieczeniach i ustawieniu **dla indywidualnych źródeł** `enabled=1,rights_gate='approved'`. Samo ustawienie `AM_RADAR_WORKER_ENABLED=1` nie uruchamia niezaakceptowanych źródeł.
6. Próba manualna `php hourly.php`, kontrola `amr_cycles`, `amr_ingest_runs`, `amr_items`; brak aktywnych źródeł to `no_enabled_sources`, wyjście błędem (nie fałszywe SUCCESS).
7. LH Cron **`23 * * * *`**, polecenie `/path/to/php /absolute/private/path/hourly.php` — ścieżki zweryfikować na konkretnej usłudze. Nie uruchamiać po URL.
8. Monitoring z niezależnego punktu: brak poprawnie zakończonego cyklu przez 90 min = alarm; 2 `degraded` = alarm; `no_enabled_sources` = niedziałający radar.

## Źródła startowe do oceny

- GitHub Changelog — `https://github.blog/changelog/feed/`
- Kubernetes Blog — `https://kubernetes.io/feed.xml`
- Go Blog — `https://go.dev/blog/feed.atom`
- CNCF Blog — `https://www.cncf.io/feed/`

Dalsze źródła (AWS, Microsoft/Azure, OpenTelemetry, OWASP, NIST, Google Cloud, Snowflake, ISO, TOGAF) wprowadzać dopiero po sprawdzeniu dostępnego kanału maszynowego, licencji, limitów i znaczenia dla architektury.

## Kontrakt weryfikacyjny

- Zero automatycznych PR-ów wydawniczych, publikacji i newsletterów.
- Brak łączenia baz/kont/kluczy obu marek.
- Jeden godzinowy cykl zapisany w `amr_cycles`, osobny wiersz na źródło w `amr_ingest_runs`.
- Blokada równoległych procesów przez `GET_LOCK`; duplikaty wpisów neutralizuje stały SHA-256.
- Przed przekazaniem do redakcji: sprawdzić status produktu (GA/preview), datę, region, implikacje architektoniczne, źródło pierwotne oraz legalność cytowania.
- Test produkcyjny pozostaje **NIEZALICZONY**, dopóki SQL i Cron nie są zweryfikowane na LH.
