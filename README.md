# Solana AI Developer - Landing Page

Landing page for the Solana-First AI Developer agent.

## Features

- Dark/light theme toggle
- Solana-inspired color scheme (purple/teal gradients)
- Roboto Mono typography throughout
- Playbooks.com-inspired design
- Waitlist signup form
- FAQ accordion
- Responsive design

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Framer Motion (animations - ready to add)

## Design System

Based on the landing page builder skill:
- No border radius on buttons (`rounded-none`)
- Section dividers with `//` mono separators
- Solana gradient: `from-[#9945FF] to-[#14F195]`
- Max-width containers at 1280px
- Roboto Mono as primary font

## Next Steps

1. Connect waitlist form to backend (Supabase/Postgres)
2. Add analytics (Plausible/Vercel Analytics)
3. Deploy to Vercel
4. Set up custom domain
5. Add email notifications for waitlist signups
