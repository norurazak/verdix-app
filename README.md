# Verdix

Scoring platform for pitch competitions/accelerators. Admins manage teams and judges; judges review team profiles and score against a rubric; standardized (bias-corrected) scoring and a deliberation dashboard help organizers pick fair winners.

Rebuild in progress: Next.js (App Router) + Firebase (Firestore + Firebase Auth), hosted on Vercel. See `verdix-project-spec.md` for the full architecture and decision record — note the addendum at the top covering the Supabase→Firebase pivot. The previous Streamlit + Google Sheets version (tagged `v1.0` on GitHub) is archived under `legacy-streamlit/`.

## Development

```bash
npm install
npm run dev
```

Requires a `.env.local` with Firebase project credentials — see `.env.local.example`.
