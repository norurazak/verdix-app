# Verdix

Scoring platform for pitch competitions/accelerators. Admins manage teams and judges; judges review team profiles and score against a rubric; standardized (bias-corrected) scoring and a deliberation dashboard help organizers pick fair winners.

Rebuild in progress: Next.js (App Router) + Supabase, hosted on Vercel. See `verdix-project-spec.md` for the full architecture and decision record. The previous Streamlit + Google Sheets version (tagged `v1.0` on GitHub) is archived under `legacy-streamlit/`.

## Development

```bash
npm install
npm run dev
```

Requires a `.env.local` with Supabase project credentials — see `.env.local.example`.
