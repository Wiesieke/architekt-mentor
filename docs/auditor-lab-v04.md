# Auditor Lab v0.4.1 — lokalna ekstrakcja AI

Lab działa wyłącznie w trybie `astro dev` na interfejsie pętli zwrotnej. Tryby **Demo offline** i **Walidacja dokumentów** nie łączą się z OpenAI. Ocena AI jest wstępna: **zweryfikowany cytat nie jest recenzją architekta**.

## Architektura i przepływ danych

1. W trybie **Analiza AI (eksperymentalna)** wklej albo wczytaj syntetyczny HLD i ADR jako tekst UTF-8 i podaj wersje. Pierwsze kliknięcie sprawdza dokumenty w karcie. Dopiero zaznaczenie zgody, wpisanie sekretu operatora i osobne kliknięcie **Wyślij dokumenty i uruchom analizę AI** wysyła sprawdzoną parę. Edycja, zmiana trybu lub wysłanie czyści zgodę i pole sekretu.
2. `POST /narzedzia/auditor-lab/ai.json` jest dołączany przez `injectRoute`, wyłącznie w lokalnym dev. Sprawdza adres klienta i host, odrzuca nagłówki przekierowań, wymaga tego samego `Origin`, `Sec-Fetch-Site: same-origin`, nagłówka aplikacji i JSON ze zgodą. Niezależnie od tych kontroli sprawdza sekret operatora w nagłówku każdego żądania, porównując jego skrót SHA-256 w stałym czasie. Sekret trafia do procesu przez stdin podczas startu, a do przeglądarki wyłącznie po wpisaniu przez operatora. Aplikacja nie umieszcza go w HTML, kodzie JavaScript, URL, logach ani trwałej pamięci. Serwer nie przekazuje go OpenAI. Nie udostępniaj portu przez tunel ani reverse proxy.
3. Ten sam [adapter OpenAI](../src/lib/auditor/openai-extractor.mjs) wywołuje Responses API z `store:false`, ścisłym schematem JSON i limitem 3000 tokenów wyjściowych. Pole `instructions` jest osobne od `input` z dokumentami. Dokumenty są niezaufanymi danymi. Limit przychodzącego JSON to 32 KiB, tekstów łącznie 12 000 bajtów UTF-8, pojedynczego dokumentu 6000 jednostek UTF-16 (minimum 20 po przycięciu). Odpowiedź dostawcy jest ograniczona do 128 KiB przed dekodowaniem i parsowaniem JSON. Limit czasu OpenAI to 45 s. Prawidłowe, autoryzowane żądanie zużywa jedyną próbę procesu przed wywołaniem dostawcy. Timeout, odmowa i błąd nie odnawiają limitu; nie ma ponowień. Hot reload i zmiana karty nie resetują limitu.
4. Model proponuje przepływy, efekty w obrębie przepływów i twierdzenia. Zwraca cytaty oraz identyfikatory źródeł z wersjami. Adapter sam wyznacza SHA-256 i półotwarte offsety `[start, end)` w UTF-16. Cytat musi wystąpić dokładnie raz w podanej wersji. Niezadeklarowany przepływ lub efekt, błędny format ID, niepasujący cytat, odmowa i niekompletna odpowiedź przerywają analizę; nie powstaje raport z częściowym wynikiem.
5. Istniejący [silnik ARCH-001](../src/lib/auditor/core.mjs) otrzymuje przepływy i twierdzenia **bez** recenzji, kluczy czy autoryzacji. Nie może uznać dowodu AI za recenzowany ani wystawić `PASS` na jego podstawie. Deklaracje efektów służą kontroli powiązań i prezentacji. Szczegóły mechanizmów są w cytatach, nie w nowych rodzajach twierdzeń. Wyraźny wymóg idempotentności konkretnego efektu można zapisać jako `exactly_once_requirement`; sam cel techniczny nie jest działającym zabezpieczeniem. Milczenie nie jest zaprzeczeniem, a nieustalony zakres efektu ma `effectId:null`.
6. Karta pokazuje listę propozycji, wynik, graf i metadane. Model i tokeny pochodzą z odpowiedzi dostawcy, czas jest mierzony lokalnie; koszt pozostaje „brak danych”, bo sama odpowiedź nie zawiera wiarygodnej kwoty. Aplikacja nie zapisuje dokumentów ani odpowiedzi na dysku i nie loguje ich treści ani klucza. Pobranie JSON jest opcjonalną czynnością użytkownika; eksport zawiera cytaty, ale nie pełne dokumenty.

## Pierwszy eksperyment w Windows PowerShell

### 1. Przygotuj Node.js i dokumenty syntetyczne

Otwórz Windows PowerShell. Poniżej jest przykładowa ścieżka używanego przenośnego Node.js 24. Jeśli masz go w innym miejscu, wpisz katalog, w którym są `node.exe` i `npm.cmd`.

```powershell
Set-Location 'C:\Project\architekt-mentor'
$nodeDir = Join-Path $env:USERPROFILE 'Tools\node24\node-v24.22.3-win-x64'
if (-not (Test-Path (Join-Path $nodeDir 'node.exe'))) { throw 'Popraw ścieżkę do przenośnego Node.js.' }
$env:PATH = "$nodeDir;$env:PATH"
node --version
if (-not (Test-Path '.\node_modules\.bin\astro.cmd')) {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Nie udało się zainstalować zależności.' }
}
```

Następny blok tworzy dwa pliki TXT z [przypadku `planetarium`](../tests/fixtures/auditor-ai-gold.mjs) i otwiera folder. Nie pobiera nic z sieci, nie zapisuje sekretów ani odpowiedzi gold. Nie edytuj plików: benchmark sprawdza zgodność ich treści.

```powershell
$caseDir = Join-Path $env:TEMP ('am-planetarium-' + [guid]::NewGuid().ToString('N'))
@'
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {extractionGold} from './tests/fixtures/auditor-ai-gold.mjs';
const dir = process.argv[2];
const {documents} = extractionGold.find(item => item.id === 'planetarium');
mkdirSync(dir);
for (const {id, version, text} of documents) {
  writeFileSync(join(dir, `planetarium-${id}-${version}.txt`), text, 'utf8');
}
'@ | node --input-type=module - "$caseDir"
if ($LASTEXITCODE -ne 0) { throw 'Nie udało się przygotować dokumentów syntetycznych.' }
Invoke-Item -LiteralPath $caseDir
```

### 2. Ustaw klucz i uruchom serwer

Zatrzymaj zwykły serwer dev (`Ctrl+C`). Przygotuj klucz API osobnego projektu OpenAI, wyłącznie na ten eksperyment. W zaufanym generatorze offline przygotuj **inny** sekret operatora: 32 losowe bajty w zapisie szesnastkowym (64 znaki `0–9` lub `a–f`). Zachowaj go tylko na czas próby. Nie zapisuj żadnego sekretu do pliku, repozytorium, historii poleceń, logu ani synchronizowanego schowka.

W prywatnym terminalu wklej poniższy **kod bez sekretów**. Dopiero gdy PowerShell pokaże maskowany prompt, podaj wskazaną wartość. Pierwszy prompt to klucz API, drugi to sekret operatora. Nie zamieniaj ich miejscami.

```powershell
function Invoke-AuditorExperiment {
    $env:AUDITOR_AI_ENABLED = '1'
    $env:AUDITOR_AI_MODEL = 'gpt-4.1-mini'
    $api = $null
    $operator = $null
    $apiPtr = [IntPtr]::Zero
    $operatorPtr = [IntPtr]::Zero
    try {
        $api = Read-Host 'Klucz API OpenAI' -AsSecureString
        $apiPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($api)
        try {
            $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($apiPtr)
        } finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($apiPtr)
            $apiPtr = [IntPtr]::Zero
            $api.Dispose()
            $api = $null
        }
        $operator = Read-Host 'Sekret operatora (64 małe znaki hex, nie klucz API)' -AsSecureString
        $operatorPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($operator)
        [Runtime.InteropServices.Marshal]::PtrToStringBSTR($operatorPtr) | node .\scripts\auditor-ai-dev.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Serwer eksperymentalny zakończył się błędem.' }
    } finally {
        if ($operatorPtr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($operatorPtr)
        }
        if ($operator) { $operator.Dispose() }
        if ($api) { $api.Dispose() }
        Remove-Item Env:\AUDITOR_AI_ENABLED, Env:\OPENAI_API_KEY, Env:\AUDITOR_AI_MODEL -ErrorAction SilentlyContinue
    }
}
Invoke-AuditorExperiment
```

Na tym etapie nic nie zostało wysłane do dostawcy. Jeśli chcesz tylko sprawdzić demo, zamiast powyższego bloku uruchom `npm.cmd run dev -- --host 127.0.0.1`.

### 3. Wczytaj, potwierdź i wyślij raz

1. Wejdź na `http://127.0.0.1:4321/narzedzia/auditor-lab`. Jeśli Astro pokazało inny port, użyj portu z terminala. Wybierz **Analiza AI (eksperymentalna)**.
2. Wczytaj `planetarium-HLD-1.0.txt` w polu HLD i zostaw wersję `1.0`. Wczytaj `planetarium-ADR-2.0.txt` w polu ADR i wpisz wersję **`2.0`**. Kliknij **Sprawdź dokumenty**. To jeszcze nie wysyła żądania.
3. Przed wysłaniem karta pokaże **Model OpenAI: `gpt-4.1-mini`** i ostrzeżenie, że operacja może być płatna. Jeśli model nie jest zgodny z planem, **nie wysyłaj**. Po odrębnej zgodzie na płatną próbę zaznacz zgodę w karcie, wpisz ten sam sekret operatora i kliknij **Wyślij dokumenty i uruchom analizę AI** dokładnie raz.
4. Po udanej odpowiedzi kliknij **Pobierz JSON**. Raport zawiera wstępne propozycje, nie zatwierdzenie architekta. Zatrzymaj serwer przez `Ctrl+C`; po wyjściu funkcja usuwa zmienne poświadczeń z tej sesji PowerShell. Jeśli wystąpi błąd lub timeout, odnotuj nieudaną próbę. Nie restartuj procesu, aby ponawiać ją bez odrębnej decyzji.

### 4. Policz metryki offline i sprawdź koszt

W tej samej sesji PowerShell wklej poniższe polecenia. Po pojawieniu się pytania podaj pełną ścieżkę pobranego raportu, np. z folderu **Pobrane**. Nie podawaj klucza ani sekretu.

```powershell
$report = (Read-Host 'Pełna ścieżka pobranego raportu JSON').Trim('"')
node .\scripts\auditor-ai-score.mjs planetarium "$report"
```

Wyniki są w skali 0–1. Przykładowo `0.8` oznacza 80%. **Precision** mówi, jaka część propozycji była poprawna, a **recall** – jaką część oczekiwanych faktów model znalazł. **F1** łączy obie miary; niski wynik jednej obniża F1. Porównaj je z `groundedFacts` i przejrzyj `falsePositives`, `falseNegatives` oraz `duplicates`. `null` znaczy, że brak podstawy do obliczenia danej miary.

Przed próbą sprawdź stawki modelu w [cenniku OpenAI](https://openai.com/api/pricing/) i ustaw alert budżetu dla osobnego projektu. Nie traktuj alertu jako blokady wydatków: serwer ogranicza liczbę wywołań do jednego na proces oraz wyjście do 3000 tokenów. Po próbie sprawdź model i tokeny w raporcie oraz rozliczenie tego projektu w [OpenAI Usage](https://platform.openai.com/usage). Lab nie otrzymuje wiarygodnej kwoty z API, więc pokazuje „brak danych”. Timeout po wysłaniu żądania nie gwarantuje braku opłaty.

Skrypt porównuje wersje i skróty tekstów z benchmarkiem. Jeśli raport nie pasuje, sprawdź, czy przesłano przygotowane pliki z właściwymi wersjami. Trzy osobno opisane przypadki to `planetarium`, `museum-incidents` i `transport-only`. Jeżeli później agregujesz wyniki, oddziel próby zakończone błędem od raportów poprawnie odebranych; dla miar kompletności całego przepływu odrzuconą parę traktuj jako brak zaakceptowanych faktów i pokaż odsetek odrzuceń obok metryk.

## Co mierzy benchmark

- **Precision, recall, F1** dotyczą unikalnych twierdzeń o tym samym rodzaju, statusie, stanie incydentu, `flowId` i `effectId`. Nie zależą od identyfikatora twierdzenia ani wyboru cytatu. To zgodność etykiet, nie dowód prawdziwości. Kolejne wystąpienie tej samej kombinacji jest raportowane jako `duplicates` i nie zwiększa recall.
- **`groundedFacts`** liczy osobne precision, recall i F1; ten sam fakt jest zaliczany tylko wtedy, gdy co najmniej jeden jego cytat jest dokładny i obejmuje ręcznie oznaczony minimalny fragment w dopuszczonym HLD lub ADR. Warianty dowodów są wymienione w gold. Pominięcie interpunkcji na końcu cytatu nie obniża wyniku, o ile cytat pozostaje dokładnym podciągiem dokumentu. Raport `evidence` odróżnia zgodność źródła i wersji od tego, czy cytat faktycznie wspiera wskazany fakt. Nie ma oceny opartej na podobieństwie tekstu.
- **FlowId i effectId**: odsetek oznaczonych przepływów i efektów odnalezionych pod właściwym ID i z poprawnym zakotwiczeniem (dla efektu również we właściwym przepływie). Przypadki mają jawne ID w źródłach, żeby nie karać modelu za tłumaczenie nazw. Miernik nie ocenia nazw wyświetlanych.
- **Przypisanie twierdzenia do efektu**: spośród twierdzeń porównywalnych po rodzaju, statusie, stanie incydentu i fragmencie, odsetek poprawnie przypisany do pary przepływ–efekt. Pominięcia ujmuje przede wszystkim recall.
- **Zgodność cytatu**: odsetek propozycji, których cytat, wersja, hash i offsety dokładnie odpowiadają źródłu. W zaakceptowanym raporcie jest to warunek wejścia; nie dowodzi poprawności interpretacji.
- Raport wymienia **false positives**, **false negatives** i duplikaty. Miara bez mianownika ma wartość `null`, nie 100%.

Dotychczasowe syntetyczne, podpisane przykłady sprawdzają logikę ARCH-001. Nowe testy z kontrolowanymi odpowiedziami sprawdzają adapter, bariery i rachunek metryk. **Żaden z tych wyników nie jest pomiarem jakości rzeczywistego modelu.**

## Ograniczenia

- Dokładny cytat i poprawna struktura nie dowodzą, że zdanie mówi to, co przypisał mu model. Model może pominąć informację, błędnie przypisać fakt do istniejącego efektu albo dać się zmylić instrukcjom w dokumencie. Nie może jednak nadać sobie uprawnień recenzenta.
- Zbiór jest mały i syntetyczny. Nieoznaczony, lecz zasadny cytat może nadal nie zostać uznany za dowód. Dwa różne zdarzenia opisane identyczną kombinacją pól nie są odróżniane przez ten benchmark. Rozbieżności wymagają ręcznego przeglądu.
- Sekret operatora chroni przed przypadkowym lub nieautoryzowanym dostępem z localhost, ale nie przed administratorem ani procesem mogącym czytać pamięć lub ruch operatora. Używaj zaufanego profilu przeglądarki i konta systemowego. Nie otwieraj narzędzi zapisujących nagłówki żądań. Limit jednego wywołania jest per proces — uruchamiaj tylko jeden proces eksperymentalny i nie używaj nadzorcy z automatycznym restartem.
- `store:false` wyłącza zapis odpowiedzi w Responses API, nie zmienia wszystkich zasad przetwarzania danych przez dostawcę. Używaj tylko syntetycznych dokumentów. Anulowanie w karcie lub timeout nie gwarantują uniknięcia opłaty po wysłaniu żądania.
- Laboratorium nie służy do zatwierdzania architektury. Build i podgląd produkcyjny nie dołączają strony ani endpointów laboratorium.

Testy offline: `node --test .\tests\auditor.test.mjs .\tests\auditor-lab.test.mjs .\tests\auditor-ai.test.mjs`.
