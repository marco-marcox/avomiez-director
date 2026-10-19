# 🐱 AvoMiez Director V2

Mobile-first AI director for short-form cinematic video creation with MiniMax M3 on GMI Cloud.

## Modes
- ✨ Create — inspiration + editable idea + director plan + H3 prompt
- 🧩 Extend Story — Part 2/Part 3 continuation with retention beats
- 🎞️ Analyze Video — local keyframe extraction → M3 analysis → editable remix/continuation

## Deploy on Vercel
1. Import this GitHub repository in Vercel.
2. In **Project → Settings → Environment Variables**, add:
   - `GMI_API_KEY` = your private GMI key
   - `GMI_MODEL` = `MiniMaxAI/MiniMax-M3`
   - `GMI_BASE_URL` = `https://api.gmi-serving.com/v1`
3. Deploy/redeploy.
4. Open the generated `*.vercel.app` URL on Android and add it to your home screen.

Never commit `.env.local` or a real API key.

## Caption Studio target markets

Target market and caption language are independent. All five platforms (TikTok,
Instagram Reels, YouTube Shorts, LinkedIn and X) receive the selected audience.
Both APIs default omitted markets to `Germany`; unsupported markets return HTTP 400.

| Market | Trend research | Firecrawl searches per refresh |
| --- | --- | --- |
| Germany | Germany, location `Germany`, country `DE` | 3 |
| DACH | Separate searches for Germany/DE, Austria/AT and Switzerland/CH | 9 |
| Global | Worldwide/international queries, no explicit location or country filter | 3 |

All searches retain the last-seven-days filter. Global is an international query
scope, not a guarantee of representative worldwide coverage: Firecrawl's default
search region can still apply. The UI displays this scope, the returned market and
the refresh time. The analyst must distinguish local evidence from wider trends.
Search parameter reference: https://docs.firecrawl.dev/api-reference/endpoint/search

Trend caches use `avomiez_trends:v2:<market>` with a 24-hour TTL. Legacy entries
without market metadata are ignored. Changing market immediately switches to its
matching cache or clears the active evidence; late responses are stored only under
their original market. Loading a cache does not renew its TTL. The caption API also
rejects mismatched or unlabelled trend context. Caption results show their actual
target market even if the selection changes during generation.

## Regression tests

Run `npm test` with Node.js 20 or newer; no installation is needed. Tests use only
simulated Firecrawl and LLM responses and test credentials. No paid API is called.
They exercise both handlers and the actual inline Caption Studio script with a
minimal DOM, including market forwarding, query parameters, audience instructions,
cache isolation, legacy data, invalid input and late-response races. This is not a
visual browser test or an end-to-end production-provider check.
