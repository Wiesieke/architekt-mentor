# ArchitectMentor Daily — 16.10.2026 (PL, szkic)

## Czy retry pogłębia przeciążenie?

Cel: wybrać jednego właściciela ponowień i mierzalny limit prób.

Fikcyjny scenariusz edukacyjny: API wywołuje usługę pośrednią, a ta katalog. Obie warstwy wykonują do trzech prób. Przy trwałym błędzie jedna operacja może wywołać dziewięć prób katalogu (3 × 3). To model, nie pomiar.

Wariant A: każda warstwa ponawia — ryzyko mnożenia ruchu. Wariant B: jeden właściciel retry — wspólny limit czasu i prób. Wariant C: brak retry — uzasadniony przy niebezpiecznych skutkach ubocznych.

Decyzja: B, warunkowo. Adapter katalogu ponawia odczyty; reszta przekazuje deadline. Zastosuj backoff z jitterem i limit współbieżności. Zapis bez idempotencji lub lookup nie powinien być automatycznie ponawiany.

Brama: sprawdź SDK i gateway; przetestuj 429/503 z Retry-After i bez niego. Zmierz próby na operację, opóźnienie i czas powrotu do normy.

Źródła pierwotne: Amazon Builders’ Library (2019), RFC 9110 §10.2.3 (2022), RFC 6585 §4 (2012). Szczegółowe adresy i potwierdzenie źródeł przed publikacją.

Powiązania: idempotencja i lookup, bulkhead, SLO. Status: szkic, bez Preview i produkcji.
