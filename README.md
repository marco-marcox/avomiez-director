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