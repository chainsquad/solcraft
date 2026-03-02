# GitHub Pages Deployment Configuration

## Overview

The Solcraft landing page is configured for static export and automatic deployment to GitHub Pages via GitHub Actions.

## Configuration

### Next.js Static Export

The `next.config.js` has been configured with:

- `output: 'export'` - Generates static HTML/CSS/JS files
- `images.unoptimized: true` - Required for static export

### Build Script

The `package.json` includes an export script:

```json
"export": "next build"
```

### GitHub Actions Workflow

Location: `.github/workflows/deploy.yml`

**Triggers:**

- Push to `main` or `master` branch
- Manual workflow dispatch

**Workflow steps:**

1. Checkout repository
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Build static export (`npm run export`)
5. Upload artifact from `./out` directory
6. Deploy to GitHub Pages

## Deployment Process

1. Push to `main` branch
2. GitHub Actions automatically runs the workflow
3. Static site is deployed to GitHub Pages
4. Site is accessible at: `solcraft.agents.chainsquad.com`

## Static Export Output

After running `npm run export`, the static site is generated in the `out/` directory:

```
out/
├── 404.html
├── agents/          # Agent documentation files
├── index.html       # Main landing page
├── index.txt
└── _next/           # Next.js static assets
    ├── static/       # CSS, JS, images
    └── ...
```

## Manual Testing

To test the static export locally:

```bash
npm run export
```

Then serve the `out/` directory with any static server:

```bash
npx serve out
# or
python3 -m http.server 8000 --directory out
```

## GitHub Pages Settings Required

Before deployment works, configure GitHub Pages:

1. Go to repository Settings → Pages
2. Set Source: **GitHub Actions**
3. (If using custom domain) Add custom domain: `solcraft.agents.chainsquad.com`
4. Configure DNS records for the custom domain

## CI/CD Workflow

```
┌─────────────┐
│ Push to main│
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ GitHub Actions Trigger │
└──────┬────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Install Dependencies   │
└──────┬────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Build Static Export    │
│ (npm run export)      │
└──────┬────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Deploy to gh-pages    │
│ (GitHub Pages)        │
└─────────────────────────┘
```

## Troubleshooting

### Build Fails

- Check Node.js version (requires Node 20+)
- Ensure all dependencies are installed
- Check for TypeScript/linting errors

### Deployment Fails

- Verify GitHub Pages is enabled in repository settings
- Check that workflow has proper permissions
- Ensure `pages: write` permission is granted

### Custom Domain Not Working

- Verify DNS A/CNAME records point correctly
- Wait for DNS propagation (up to 48 hours)
- Check GitHub Pages settings for custom domain configuration

## Production URLs

- GitHub Pages URL: `https://<username>.github.io/<repo>/`
- Custom Domain: `https://solcraft.agents.chainsquad.com`
