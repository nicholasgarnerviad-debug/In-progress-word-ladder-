# Deployment Guide

This guide covers deploying the Word Ladder Game to production across multiple platforms (Vercel, Firebase Hosting, or Docker).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Building for Production](#building-for-production)
4. [Pre-deployment Testing](#pre-deployment-testing)
5. [Deployment Options](#deployment-options)
6. [Post-deployment Verification](#post-deployment-verification)
7. [Known Limitations](#known-limitations)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher (v18+ required for compatibility)
- **npm**: v9.0.0 or higher (installed with Node.js)
- **Git**: For cloning and version control
- **Browser support**: 
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### Firebase Setup

Before deploying, you must set up a Firebase project:

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Firestore Database**:
   - Go to "Firestore Database" in the console
   - Click "Create Database"
   - Choose "Start in production mode"
   - Select the closest region to your users
3. **Enable Firebase Hosting** (if using Firebase):
   - Go to "Hosting" in the console
   - Click "Get started" and follow prompts
   - Install Firebase CLI: `npm install -g firebase-tools`
4. **Get Firebase Config**:
   - Go to Project Settings (gear icon)
   - Copy your web app config (API key, project ID, etc.)
   - You'll use these values for environment variables

### Cloud Functions (Optional)

If you plan to use Cloud Functions for leaderboard management or backend services:

1. Enable Cloud Functions in your Firebase project
2. Install gcloud CLI: `https://cloud.google.com/sdk/docs/install`
3. Ensure Firestore rules allow Cloud Functions to write data

---

## Environment Setup

### 1. Firebase Environment Variables

Create a `.env.local` file in the project root with your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important**: 
- Never commit `.env.local` to version control (it's in `.gitignore`)
- For CI/CD, set these as environment variables in your platform (Vercel, GitHub Actions, etc.)
- Treat API keys as secrets; rotate periodically

### 2. Firestore Security Rules

Update your Firestore security rules to allow proper access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leaderboard: Allow public read, authenticated write
    match /leaderboard/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User profiles: Allow users to read/write their own data
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Public data: Allow public read
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Adjust these rules based on your app's security requirements.

### 3. Firebase Configuration File

The project uses environment variables injected at build time. No additional configuration file is needed beyond `.env.local`.

---

## Building for Production

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`.

### 2. Build the Application

```bash
npm run build
```

This command:
- Uses Vite to bundle the React application
- Minifies JavaScript and CSS
- Optimizes assets for performance
- Outputs to the `dist/` directory

**Build output**:
- Typical bundle size: ~90 KB gzipped (281 KB uncompressed)
- Build time: < 1.1 seconds
- Output location: `./dist/`

### 3. Verify Build Output

After building, check that the `dist/` directory contains:

```
dist/
├── index.html
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── (other assets)
```

---

## Pre-deployment Testing

Before deploying to production, run the complete test suite:

### 1. Unit and Integration Tests

```bash
npm test
```

This runs Jest tests covering:
- Game logic and algorithms
- State management hooks
- Component rendering
- Utility functions
- Storage persistence

**Expected result**: All tests pass

### 2. End-to-End Tests

```bash
npm run e2e
```

This runs Playwright tests covering:
- Full user workflows (play classic mode, time attack, etc.)
- Navigation and routing
- Leaderboard submission
- Theme switching
- Offline functionality
- Mobile responsiveness

**Expected result**: All E2E tests pass

### 3. Production Build Test

```bash
npm run build
```

Verify the build completes without errors and output is generated.

### 4. Local Production Preview (Optional)

After building, you can preview the production build locally:

```bash
npm install -g serve
serve dist/
```

Then visit `http://localhost:3000` in your browser to test the production build.

---

## Deployment Options

### Option 1: Vercel (Recommended for Speed)

Vercel is optimized for Next.js but works well with Vite applications.

#### Setup

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel
   ```
   Follow the prompts to link to your Vercel account and create a new project.

3. **Configure environment variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all `VITE_FIREBASE_*` variables
   - They must be available during build time

#### Deploy

```bash
vercel deploy --prod
```

**Key features**:
- Automatic HTTPS
- Global CDN with edge caching
- Automatic deployment on git push (with Vercel GitHub integration)
- Easy rollbacks
- Preview URLs for testing

**Vercel configuration** (automatic, but you can customize `vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "env": {
    "VITE_FIREBASE_API_KEY": "@vite_firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@vite_firebase_auth_domain",
    "VITE_FIREBASE_PROJECT_ID": "@vite_firebase_project_id",
    "VITE_FIREBASE_STORAGE_BUCKET": "@vite_firebase_storage_bucket",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "@vite_firebase_messaging_sender_id",
    "VITE_FIREBASE_APP_ID": "@vite_firebase_app_id"
  }
}
```

### Option 2: Firebase Hosting

Deploy directly using Firebase's built-in hosting.

#### Setup

1. **Initialize Firebase in your project**:
   ```bash
   firebase init hosting
   ```
   
   When prompted:
   - Select your Firebase project
   - Choose `dist` as the public directory
   - Say "no" to single-page app rewriting (unless you want all routes to serve index.html)
   - Say "no" to overwriting existing files

2. **Configure `firebase.json`** (already done, but verify):
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

3. **Set environment variables** in your CI/CD or local shell:
   ```bash
   export VITE_FIREBASE_API_KEY=your_key
   export VITE_FIREBASE_AUTH_DOMAIN=your_domain
   # ... etc
   ```

#### Deploy

```bash
npm run build
firebase deploy --only hosting
```

Or use automatic CI/CD:

```bash
firebase deploy --only hosting --token $FIREBASE_TOKEN
```

**Key features**:
- Free tier with generous quotas (1 GB storage, 10 GB/month bandwidth)
- Automatic SSL/TLS
- Global CDN
- Easy rollbacks via Firebase Console
- Integrates with Cloud Functions and Firestore

### Option 3: Docker

Deploy using Docker containers (for more control over environment).

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean npm cache
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install a simple HTTP server to serve the static files
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Build and Run Locally

```bash
# Build the Docker image
docker build -t word-ladder:latest .

# Run the container
docker run -p 3000:3000 \
  -e VITE_FIREBASE_API_KEY=your_key \
  -e VITE_FIREBASE_AUTH_DOMAIN=your_domain \
  # ... etc \
  word-ladder:latest
```

Visit `http://localhost:3000`

#### Deploy to Cloud Provider

**Google Cloud Run**:

```bash
gcloud run deploy word-ladder \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**AWS ECS, Azure Container Instances, etc.**: Push to your registry and deploy per platform instructions.

---

## Post-deployment Verification

After deploying, verify the application works correctly:

### 1. Load Testing

Test that the app loads and responds quickly:

```bash
# From browser console or external monitor
curl -I https://your-deployed-app.com
```

Expected response:
- Status: 200 OK
- Content-Type: text/html
- Load time: < 2 seconds globally

### 2. Core Gameplay Test

1. **Navigate to home page** → Should show game modes (Classic, Time Attack)
2. **Play Classic Mode**:
   - Click "Play Classic"
   - Select a puzzle
   - Complete a game successfully
   - Verify stats are saved
3. **Play Time Attack Mode**:
   - Click "Play Time Attack"
   - Start a game
   - Verify timer counts down correctly
   - Complete the game

### 3. Leaderboard Test

1. **Submit a score**:
   - Complete a game
   - Leaderboard should update automatically
2. **View leaderboard**:
   - Navigate to Leaderboard page
   - Verify your score appears
   - Check filters work (time period, game mode)

### 4. Offline Functionality

1. **Play offline** (after loading online):
   - Open browser DevTools → Network → Offline
   - Continue playing a game
   - Verify game functions (may show data from cache)
2. **Sync when back online**:
   - Reconnect to network
   - Refresh page
   - Verify stats and leaderboard sync

### 5. Theme Testing

1. **Test Dark Mode**:
   - Open Settings
   - Toggle Dark Mode
   - Verify colors and contrast (WCAG AA minimum)
   - Verify no images break or become invisible
2. **Test Light Mode**: Same as above
3. **Test System Default**: Set OS to dark/light mode, reload app

### 6. Mobile Responsive Testing

Test on multiple viewports:

```
- iPhone SE (375px width)
- iPhone 12/13 (390px)
- iPhone 12 Pro Max (430px)
- iPad (768px)
- Desktop (1920px+)
```

For each breakpoint:
- All text is readable
- Buttons are tappable (44px minimum touch target)
- No horizontal scrolling
- Virtual keyboard displays correctly
- Game board is properly sized

### 7. Achievement/Badge Verification

1. **Trigger achievements**:
   - Complete 5 games → "5-Game Streak"
   - Win a game on hard difficulty → "Champion"
   - Etc.
2. **Verify badges display** in Settings or stats panel
3. **Verify persistence** across sessions

### 8. Accessibility Check

1. **Keyboard navigation**:
   - Use only Tab, Enter, arrow keys
   - All interactive elements are reachable
   - Focus is visible on all buttons/inputs
2. **Screen reader test** (use VoiceOver on Mac, NVDA on Windows):
   - Game instructions are announced
   - Word list is readable
   - Stats are clearly labeled
3. **Color contrast**:
   - Use WebAIM Contrast Checker
   - All text meets WCAG AA (4.5:1 for normal text, 3:1 for large)

---

## Known Limitations

### 1. Weekly Resets

- **Behavior**: Puzzle hints reset every Monday at UTC midnight
- **Impact**: Some users may experience hint availability changes depending on timezone
- **Mitigation**: Document reset timing in app or settings

### 2. IndexedDB Cache Limits

- **Limit**: Browser-dependent (typically 50 MB - 1 GB)
- **Impact**: On older devices or with many games, cache may be cleared
- **Mitigation**: Implement periodic cache cleanup; prioritize recent games

### 3. Real-time Listener Limits

- **Firestore limit**: 100 concurrent listeners per user
- **Impact**: Heavy players with many tabs open may lose some updates
- **Mitigation**: Close unused tabs; Cloud Functions can consolidate listeners

### 4. Network Latency

- **Impact**: Leaderboard submissions may be delayed on slow networks
- **Mitigation**: Implement optimistic UI updates; show sync status

### 5. Puzzle Generation Performance

- **Impact**: Generating large puzzle graphs can be slow on weak devices
- **Mitigation**: Pre-generate common puzzles; implement progressive loading

### 6. Browser Storage Quota

- **Limit**: Usually 50% of free disk space (subject to browser policies)
- **Impact**: Cannot store unlimited game history
- **Mitigation**: Archive old games; limit history to last 100 games

---

## Troubleshooting

### Deploy Issues

#### Build Fails with "Missing Environment Variables"

**Solution**: Verify all `VITE_FIREBASE_*` variables are set:

```bash
# Check local variables
cat .env.local | grep VITE_FIREBASE

# For CI/CD, verify in platform dashboard
# Vercel: Project Settings → Environment Variables
# Firebase: Set via firebase-tools config
# Docker: Pass via -e flags or env file
```

#### Firebase Authentication Issues

**Problem**: "Permission denied" errors when reading Firestore.

**Solution**:
1. Check Firestore security rules allow your app
2. Verify `firebaseConfig` values are correct
3. Check Firebase project has Firestore enabled
4. Test with anonymous access rules temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### Slow Load Times

**Causes & Solutions**:

1. **Large bundle size**:
   ```bash
   npm run build
   # Check dist/assets for large files
   # Consider code splitting if needed
   ```

2. **CDN not caching**:
   - Vercel: Automatic, usually < 100ms
   - Firebase: Check cache headers in `firebase.json`
   - Docker: Add reverse proxy (Nginx) with caching

3. **Database queries slow**:
   - Add Firestore indexes (Firebase console suggests them)
   - Limit queries with `.limit(50)`
   - Use pagination for leaderboards

#### Offline Functionality Not Working

**Solution**:
1. Verify service worker is registered (if using one)
2. Check IndexedDB is enabled in browser
3. Test with offline simulation in DevTools
4. Ensure API calls have offline fallbacks

#### Theme Not Persisting

**Solution**:
1. Verify localStorage is enabled
2. Check storage key: `theme-preference`
3. Verify CSS `dark:` classes are applied correctly
4. Check Tailwind config includes `darkMode: 'class'`

#### Mobile Touchscreen Issues

**Solution**:
1. Ensure buttons are 44px minimum touch target
2. Remove `user-select: none` from interactive elements
3. Test on real device (not just Chrome DevTools)
4. Check for -webkit CSS prefixes where needed

---

## Security Checklist

Before production deployment:

- [ ] Firebase API keys are environment-only (not in source code)
- [ ] Firestore security rules restrict unauthorized access
- [ ] HTTPS is enabled (automatic on Vercel, Firebase, Docker with reverse proxy)
- [ ] Content Security Policy headers are set (CSP)
- [ ] No sensitive data logged to console in production
- [ ] Dependencies are up-to-date (`npm audit`)
- [ ] Environment variables are rotated periodically
- [ ] Error messages don't expose internal details
- [ ] Rate limiting is configured (if using Cloud Functions)

---

## Monitoring & Maintenance

### Performance Monitoring

1. **Set up Vercel/Firebase Analytics**:
   - Track page load time
   - Monitor error rates
   - Track user engagement

2. **Firestore monitoring**:
   - Monitor quota usage
   - Check for runaway queries
   - Review Cloud Function costs

### Regular Tasks

- **Weekly**: Review error logs and user feedback
- **Monthly**: Update dependencies with `npm update`
- **Quarterly**: Run full test suite and audit
- **Annually**: Review and update security rules

---

## Support & Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Vite Documentation**: https://vitejs.dev
- **React Documentation**: https://react.dev
- **Firestore Guide**: https://firebase.google.com/docs/firestore
- **Vercel Docs**: https://vercel.com/docs
- **Docker Docs**: https://docs.docker.com

---

## Questions?

For deployment issues or questions, check:

1. Application logs (browser console, Vercel/Firebase dashboard)
2. Cloud Functions logs (if using Cloud Functions)
3. Firestore rules errors (Firebase console)
4. Network tab in DevTools

Document the issue and create a GitHub issue with logs and reproduction steps.
