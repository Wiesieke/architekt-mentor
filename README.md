# Architekt-Mentor — wersja produkcyjna (front + proxy)

Generator HLD, w którym **klucz API siedzi po stronie serwera**, a przeglądarka woła Twoją funkcję,
nie API Anthropic. Dzięki temu można to bezpiecznie wystawić ludziom — klucz nie jest widoczny,
Twój prompt też nie.

## Struktura plików (zachowaj dokładnie)

```
architekt-mentor/
├── index.html          ← front (woła /api/generate)
└── api/
    └── generate.js      ← funkcja serverless (trzyma klucz, prompt, limity)
```

`api/generate.js` MUSI leżeć w katalogu `api/` — to na tej podstawie Vercel robi z niego endpoint `/api/generate`.

---

## Wdrożenie na Vercel (najprostsza droga, darmowy plan)

### Wariant A — przez stronę Vercel (bez terminala, polecany na start)

1. Załóż darmowe konto na **vercel.com** (możesz przez GitHub).
2. Wrzuć ten folder do repozytorium GitHub (lub użyj „deploy" z dysku — Vercel obsługuje import folderu).
3. W Vercel: **Add New → Project →** wskaż repozytorium. Framework: **Other** (to statyczny front + funkcja).
4. Zanim klikniesz Deploy, w **Environment Variables** dodaj:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Twój klucz `sk-ant-…`
5. **Deploy.** Po chwili dostaniesz adres typu `https://architekt-mentor.vercel.app`. Wejdź i testuj.

### Wariant B — przez terminal (CLI)

```bash
npm i -g vercel              # jednorazowo
cd architekt-mentor
vercel                       # pierwszy deploy (preview), zaloguje i poprowadzi
vercel env add ANTHROPIC_API_KEY   # wklej klucz; wybierz Production (i Preview)
vercel --prod                # wdrożenie produkcyjne
```

To wszystko. Nie potrzebujesz `package.json` — funkcja używa wbudowanego `fetch` (Node 18+) i nie ma zależności.

---

## Zmienna środowiskowa — to jest sedno bezpieczeństwa

Klucza **nigdy nie wpisujesz w kod ani w pliki, które trafiają do repo.** Trzymasz go wyłącznie jako
`ANTHROPIC_API_KEY` w ustawieniach projektu (Environment Variables). Funkcja czyta go z
`process.env.ANTHROPIC_API_KEY`. Po zmianie zmiennej zrób ponowny deploy.

---

## Wbudowane zabezpieczenia kosztów (w `api/generate.js`)

- **Whitelist modeli** — można użyć tylko Haiku/Sonnet/Opus, nic spoza listy.
- **Sufit `max_tokens`** — twardy limit 6000 po stronie serwera, niezależnie od tego, co przyśle front.
- **Limit długości briefu** — odrzuca briefy > 6000 znaków (blokuje próby wymuszenia drogich wywołań).
- **Prosty rate limit** — maks. 8 zapytań / minutę z jednego IP.

> **Uwaga o rate limicie:** to wersja „best-effort" w pamięci instancji. Na serverless funkcje bywają
> mnożone/wygaszane, więc to deterrent, nie twarda gwarancja. Gdy ruch urośnie, dołóż wspólny licznik
> (np. Vercel KV albo Upstash Redis) — wtedy limit działa globalnie.

**Najpewniejszy bezpiecznik na końcu:** w Anthropic Console ustaw **miesięczny limit wydatków**
(spend limit). Cokolwiek się stanie, rachunek nie przekroczy progu, który sam ustawisz. Zrób to od razu.

---

## Alternatywa: Cloudflare Pages / Workers

Działa analogicznie, ale funkcja ma inny kształt: zamiast `module.exports = (req,res)`,
piszesz `export default { async fetch(request, env) { ... } }`, a klucz czytasz z `env.ANTHROPIC_API_KEY`
(ustawiany w panelu Cloudflare jako secret). Reszta logiki (budowa wiadomości, wywołanie API, limity)
jest identyczna. Jeśli wolisz Cloudflare, daj znać — przerobię `generate.js` na ten format.

---

## Jak to testować lokalnie przed wdrożeniem

```bash
npm i -g vercel
cd architekt-mentor
vercel dev        # uruchamia front + funkcję lokalnie pod http://localhost:3000
```
`vercel dev` poprosi o zmienną `ANTHROPIC_API_KEY` (albo dodaj plik `.env.local` z `ANTHROPIC_API_KEY=sk-ant-...`
— i dopisz `.env.local` do `.gitignore`, żeby nie trafił do repo).

---

## Co dalej (gdy podstawa działa)

- Wspólny rate limit (Vercel KV / Upstash) zamiast pamięci instancji.
- Twardy dzienny cap liczby generacji (ochrona kosztu darmowego narzędzia).
- Prosty licznik użycia / log (ile generacji, jakie modele) — przyda się do decyzji o monetyzacji.
- Dopiero potem: konta, zapisywanie projektów, płatności.
