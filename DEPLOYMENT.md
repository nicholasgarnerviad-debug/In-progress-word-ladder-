# Deployment Guide

## Automated Deployment (GitHub Actions)

A GitHub Actions workflow has been configured to automatically build, test, and deploy your application on every push to the `main` branch.

### Current Setup: GitHub Pages

The workflow (`.github/workflows/deploy.yml`) performs:
1. **Install dependencies** — runs `npm ci`
2. **Run tests** — executes full test suite (1264+ tests)
3. **Build** — creates optimized production bundle with `npm run build`
4. **Deploy** — publishes to GitHub Pages

### To Enable GitHub Pages Deployment:

1. Go to your GitHub repository settings
2. Navigate to **Settings → Pages**
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages**
   - Folder: **/(root)**
4. Click **Save**

The first workflow run after enabling will deploy your site to:
```
https://nicholasgarnerviad-debug.github.io/Word-Ladder-backup/
```

### Workflow Status:
- View runs: **Actions** tab in GitHub
- On success: Site is live and updated
- On failure: Tests or build errors are reported (fix and push to retry)

---

## Alternative Deployment Platforms

### Vercel (Recommended for React Apps)

1. Connect your GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Configure build:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Click **Deploy** — Vercel automatically deploys on push to main
4. Custom domain available in Vercel dashboard

### Netlify

1. Connect GitHub at [netlify.com/drop](https://app.netlify.com/drop)
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Netlify watches your repo and auto-deploys on push

### Firebase Hosting

The project includes Firebase dependencies. To deploy:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase project:
   ```bash
   firebase init hosting
   ```

3. Configure:
   - Public directory: `dist`
   - Single-page app: **Yes**

4. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

Or use GitHub Actions (update `.github/workflows/deploy.yml`):
```yaml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
    channelId: live
    projectId: your-firebase-project
```

---

## Manual Deployment

If you prefer to deploy manually without CI/CD:

```bash
# Build the production bundle
npm run build

# The dist/ folder is ready to upload to any static hosting:
# - GitHub Pages (push to gh-pages branch)
# - AWS S3 + CloudFront
# - Azure Static Web Apps
# - DigitalOcean App Platform
# - Any HTTP server
```

---

## Environment Variables

If you need Firebase configuration or other secrets:

1. Add to GitHub repository **Settings → Secrets and variables → Actions**
2. Create secrets (e.g., `FIREBASE_SERVICE_ACCOUNT`, `API_KEY`)
3. Reference in workflow:
   ```yaml
   env:
     REACT_APP_API_KEY: ${{ secrets.API_KEY }}
   ```

---

## Monitoring

After deployment:
- **View logs**: GitHub Actions tab (see build/test output)
- **Check status**: Visit your deployed site
- **Debug locally**: Run `npm run dev` to test before pushing
- **Rollback**: Revert commit and push to redeploy previous version

---

## Next Steps

1. ✅ **GitHub Actions workflow created** (`.github/workflows/deploy.yml`)
2. ⏭️ **Enable GitHub Pages** in repository settings
3. ⏭️ **Push a test commit** to trigger first deployment
4. ⏭️ **Monitor Actions tab** for build/deploy status

All future pushes to `main` will automatically build, test, and deploy your application.
