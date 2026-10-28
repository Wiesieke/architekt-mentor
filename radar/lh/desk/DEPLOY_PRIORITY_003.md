# ArchitectMentor Desk — wdrożenie oceny i priorytetów (migracja 003)

Wersja dla istniejącego panelu na LH.pl. **Nie zmienia** Crona, źródeł RSS, WRYCUT, Authenticatora ani katalogu `.vault`. Nie publikuje treści automatycznie.

## Co się zmienia

- Ręczny priorytet P1 (pilne), P2 (ważne), P3 (obserwuj) lub brak.
- Ręczna ocena wpływu na architekturę IT w skali 1–5 lub „nieoceniony”.
- Filtr priorytetu, sortowanie kolejki według priorytetu, licznik P1.
- Obie oceny zapisywane w `amr_decisions` i w istniejącym dzienniku `amr_decision_audit.snapshot_json`.
- Dotychczasowe decyzje/notatki i historia pozostają bez zmian. Stare pozycje otrzymują „brak priorytetu” i „nieoceniony”.
- Oceny są **subiektywnymi decyzjami redakcyjnymi** i nie potwierdzają faktów ani praw do treści.

## Kolejność wdrożenia (ważna!)

1. Zaloguj się do phpMyAdmin. Wybierz **wyłącznie** bazę `serwer428682_architectradar`.
2. Wykonaj backup całej bazy: Eksport → Szybka → SQL → Wykonaj. Przechowuj poza publicznym WWW.
3. W SQL wykonaj tylko odczyt:
   ```sql
   SELECT DATABASE();
   SHOW COLUMNS FROM amr_decisions LIKE 'revision';
   SHOW COLUMNS FROM amr_decisions LIKE 'priority';
   SHOW COLUMNS FROM amr_decisions LIKE 'impact_score';
   ```
   Oczekiwane: poprawna nazwa bazy, istnieje `revision`, brak `priority` oraz `impact_score`. Jeśli stan jest inny, **STOP**, nie uruchamiaj migracji.
4. Po backupie zastosuj **jeden raz** `radar/db/003_architectmentor_editorial_priority.sql` (jeden `ALTER TABLE`). Jeśli wystąpi błąd, **STOP** i zachowaj dotychczasowe pliki PHP/JS; nie powtarzaj migracji bez sprawdzenia struktury.
5. Sprawdź odczytem:
   ```sql
   SHOW COLUMNS FROM amr_decisions LIKE 'priority';
   SHOW COLUMNS FROM amr_decisions LIKE 'impact_score';
   ```
   Oba pola muszą istnieć. Nie zmieniaj żadnych istniejących danych.
6. Dopiero teraz przez FileZilla wgraj **cztery** nowe pliki z katalogu `radar/lh/desk/` do `/public_html/mentor-api.sensinte.com/architect-desk/`, nadpisując poprzednie: `api.php`, `app.js`, `app.css`, `index.php`. Najpierw zachowaj prywatny backup dotychczasowych czterech plików na komputerze (nie w public_html).
7. **Nie przesyłaj** `.vault`, `config.private.php`, `auth.php`, `totp.php`, `desk-db.php`, plików testowych ani SQL do katalogu WWW. Nie zmieniaj przełączników zapisu ani Crona.
8. Odśwież panel `https://mentor-api.sensinte.com/architect-desk/` (Ctrl+F5), zaloguj się i potwierdź, że kolejka nadal pokazuje dotychczasowe materiały i decyzję `REQUEST_RESEARCH`.

## Bezpieczny test ręczny

1. Wybierz istniejący materiał, ustaw np. priorytet **P2 · Ważne**, wpływ **3 · Istotny**, zachowując poprzednią decyzję i notatkę.
2. Zapisz; status powinien mówić `Ocena i decyzja zapisane z historią`. Nic nie zostaje opublikowane.
3. Zmień filtr `Wszystkie priorytety` na `P2`; materiał powinien pozostać widoczny. Sortowanie `Najpierw P1` powinno uwzględniać priorytety.
4. Zweryfikuj historię:
   ```sql
   SELECT d.priority,d.impact_score,d.revision,a.snapshot_json
   FROM amr_decisions d
   JOIN amr_decision_audit a ON a.item_id=d.item_id AND a.revision=d.revision
   ORDER BY a.audit_id DESC LIMIT 1;
   ```
   W ostatniej rewizji powinny widnieć nowe wartości (np. 2 i 3). Zachowaj też kontrolę 403 dla `.vault/config.private.php` i `.vault/architect-desk-auth.json`.

## Cofnięcie wersji panelu

Jeśli kod nie działa po udanej migracji, **przywróć wyłącznie cztery poprzednie pliki aplikacji** z lokalnego backupu. Starszy kod ignoruje dodatkowe kolumny, więc nie trzeba wycofywać migracji bazy. Jeśli migracja nie powiedzie się, nie instaluj nowego kodu. Nie usuwaj ręcznie kolumn ani danych.

## Ograniczenia

Brak automatycznej oceny przez AI. Skala 1–5 i P1–P3 są ręczne. Wymagana migracja 002. Dostęp do `.vault` nadal zależy od zabezpieczeń Apache na LH.pl; po każdej zmianie hostingu trzeba ponownie sprawdzić 403.
