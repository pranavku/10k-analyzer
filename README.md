# 10-K Event Classifier — Cloudflare Workers

Two Workers:
- `sec-edgar-proxy` — CORS proxy for SEC EDGAR APIs
- `10k-analyzer` — Full application

## Deploy (5 minutes)

### Prerequisites
- Node.js installed
- Cloudflare account (free tier works)

### Steps

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy the proxy first**
   ```bash
   cd proxy
   wrangler deploy
   ```
   Note the URL it prints, e.g. `https://sec-edgar-proxy.yoursubdomain.workers.dev`

4. **Update the proxy URL in the app**

   Open `app/worker.mjs` and find this line near the top of the HTML:
   ```javascript
   const PROXY = 'https://sec-edgar-proxy.pranav33.workers.dev/?url=';
   ```
   Replace `pranav33` with your Cloudflare workers.dev subdomain.

5. **Deploy the app**
   ```bash
   cd app
   wrangler deploy
   ```

6. **Open your app**
   ```
   https://10k-analyzer.yoursubdomain.workers.dev
   ```

## Architecture

```
Browser
  └── 10k-analyzer Worker (serves HTML/JS)
        ├── Claude API (direct, NLP analysis)
        └── sec-edgar-proxy Worker
              ├── data.sec.gov (XBRL financials)
              ├── www.sec.gov  (tickers, filings)
              └── efts.sec.gov (search)
```

## Costs
- Both Workers run on Cloudflare's free tier (100,000 req/day)
- Claude API: ~$0.001 per analysis (Haiku model)
- SEC EDGAR: completely free
