# SIGNAL — Deploy Guide

## Projektstruktur

```
signal-app/
├── api/
│   ├── quote.js          ← /api/quote?symbol=AAPL
│   ├── news.js           ← /api/news?symbol=AAPL
│   └── market-news.js    ← /api/market-news?category=crypto
├── public/
│   └── index.html        ← Die App
└── vercel.json           ← Routing-Config
```

---

## Deploy in 5 Schritten

### 1. Finnhub API Key holen (kostenlos)
→ https://finnhub.io → "Get free API key"  
Kein Kreditkarte, 60 Calls/Minute kostenlos.

### 2. Vercel Account (kostenlos)
→ https://vercel.com → mit GitHub einloggen

### 3. Projekt auf GitHub pushen
```bash
cd signal-app
git init
git add .
git commit -m "initial"
gh repo create signal-app --public --push
```
Oder manuell auf github.com → New Repository → Dateien hochladen.

### 4. Auf Vercel deployen
1. vercel.com → "Add New Project"
2. GitHub Repo auswählen → "Import"
3. **Root Directory**: `signal-app` (falls du ein Mono-Repo hast)
4. **Framework Preset**: Other
5. **Deploy** klicken

### 5. Environment Variable setzen (WICHTIG — Key bleibt geheim)
Nach dem ersten Deploy:
1. Vercel Dashboard → dein Projekt → **Settings → Environment Variables**
2. Name: `FINNHUB_KEY`
3. Value: `dein_finnhub_api_key`
4. Environment: Production + Preview + Development alle aktivieren
5. **Save** → dann **Redeploy** (Deployments → drei Punkte → Redeploy)

---

## Fertig
Deine App läuft jetzt auf `https://signal-app.vercel.app` (oder ähnlich).  
Jeder kann sie aufrufen — niemand sieht deinen Key.

---

## Lokal testen (optional)
```bash
npm i -g vercel
cd signal-app
vercel dev
```
Dann `.env.local` anlegen:
```
FINNHUB_KEY=dein_key_hier
```

---

## Kosten
- Vercel Free Tier: 100GB Bandwidth, 100k Function Invocations/Monat — für persönlichen Use mehr als genug.
- Finnhub Free Tier: 60 API Calls/Minute — reicht locker.
