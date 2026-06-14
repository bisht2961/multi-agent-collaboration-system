# Week 4: Deployment Guide

## From Local to Live

By end of Week 3, you have a working system locally. Week 4 makes it live on the internet with a URL you can share.

**Goal**: Get a live demo URL that recruiter can click and use immediately.

---

## Architecture: Where Everything Lives

```
Your GitHub Repository (code)
    ↓
Railway (Backend - FastAPI server)
    ├── Runs your app/main.py
    └── Accessible at: https://multi-agent-api.railway.app
    
Vercel (Frontend - Dashboard)
    ├── Serves app/static/index.html
    └── Accessible at: https://multi-agent.vercel.app
    
Browser
    ├── Loads dashboard from Vercel
    └── Connects to API at Railway via WebSocket
```

---

## Part 1: Deploy Backend to Railway (Day 1)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your GitHub

### Step 2: Prepare Your Code

Make sure your repository has:

```bash
# Required files
requirements.txt        ✓
app/main.py            ✓
app/static/index.html  ✓
core/                  ✓
.env.example           ✓ (no secrets here)
```

Create `.env.example`:
```
ANTHROPIC_API_KEY=your_key_here
```

### Step 3: Create Railway Project

1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Select your `multi-agent-system` repository
5. Railway auto-detects it's Python

### Step 4: Set Environment Variables

In Railway dashboard:
1. Go to Variables tab
2. Add:
   ```
   ANTHROPIC_API_KEY = sk-ant-xxxxx (your real key)
   PYTHON_VERSION = 3.11
   ```
3. Save

### Step 5: Deploy

1. Railway automatically deploys from main branch
2. Wait for build to complete (2-3 minutes)
3. See "Deployment successful" message
4. Get your URL: `https://multi-agent-[random].railway.app`

### Step 6: Test Backend

```bash
# Test health check
curl https://multi-agent-[random].railway.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","agents":[...]}

# You now have a working backend API!
```

### Railway Troubleshooting

**Build fails:**
- Check logs in Railway dashboard
- Make sure `requirements.txt` has all dependencies
- Verify `.env` has ANTHROPIC_API_KEY set

**App crashes on startup:**
- Check Railway logs
- Verify app/main.py can import all modules
- Test locally first: `python app/main.py`

**Timeout errors:**
- Claude API calls take 30-60s
- Railway's default timeout is 30s
- Set timeout in Railway settings to 120s

---

## Part 2: Deploy Frontend to Vercel (Day 1-2)

Frontend only needs the HTML/CSS/JS - no backend logic.

### Step 1: Create Frontend Repository (Optional but Cleaner)

You can either:
- Deploy from same repo but Vercel serves `app/static/`
- Create separate repo just for frontend

**Recommended**: Separate repo (cleaner)

```bash
# Create new directory
mkdir multi-agent-dashboard
cd multi-agent-dashboard
git init

# Copy frontend files
cp ../multi-agent-system/app/static/index.html ./
cp ../multi-agent-system/.gitignore ./

# Update index.html to point to Railway API
# Find this line:
const ws = new WebSocket(`${protocol}//${window.location.host}/ws/task`);

# Change to:
const apiUrl = "https://multi-agent-[random].railway.app";
const ws = new WebSocket(`${protocol === 'https:' ? 'wss:' : 'ws:'}${apiUrl}/ws/task`);

# Commit
git add .
git commit -m "Initial dashboard deployment"
git push origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

### Step 3: Deploy Dashboard

1. Click "New Project"
2. Import GitHub repository (dashboard repo)
3. Vercel detects it's static HTML
4. Set root directory to `./` (or wherever index.html is)
5. Deploy

### Step 4: Get Dashboard URL

After deployment:
- Vercel gives you URL: `https://multi-agent-dashboard.vercel.app`
- This is your **live demo URL**!

### Step 5: Update WebSocket Connection

In your dashboard HTML, update the WebSocket URL:

```javascript
// OLD (localhost)
const ws = new WebSocket(`${protocol}//${window.location.host}/ws/task`);

// NEW (production)
const railwayUrl = "https://multi-agent-[random].railway.app";
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProtocol}${railwayUrl.replace('https://', '').replace('http://', '')}/ws/task`);
```

### Test Live Demo

1. Open dashboard: `https://multi-agent-dashboard.vercel.app`
2. Submit a task
3. See agents execute in real-time
4. Get results

🎉 **You now have a live demo!**

---

## Part 3: Custom Domain (Optional but Professional)

If you want `my-multi-agent.com` instead of `vercel.app`:

### Using Vercel Domain

1. In Vercel project settings
2. Add domain (e.g., `multi-agent-demo.vercel.app`)
3. Free with Vercel

### Using Custom Domain

1. Buy domain (Namecheap, GoDaddy, etc)
2. Vercel instructions for adding custom domain
3. Update DNS records
4. Point to Vercel

---

## Part 4: Final Checklist

### Before Sending to Recruiters ✅

```
[ ] Dashboard loads (no errors in console)
[ ] Can submit a task
[ ] Agents execute and show progress
[ ] Final output displays
[ ] Metrics show execution time
[ ] No console errors (F12 → Console)
[ ] Mobile responsive (test on phone)
[ ] Fast loading (<3 seconds)
```

### README.md Update

Add to your main repository:

```markdown
## Live Demo

🚀 **[Live Demo URL](https://your-domain.com)**

### Usage

1. Open the link above
2. Enter a task in the text area
3. Click "Execute Agents"
4. Watch agents work in real-time
5. See results and metrics

### Features

- Real-time agent execution visualization
- 4 specialized AI agents (Research, Analysis, Writing, Validation)
- Performance metrics and execution tracking
- 3.2x faster than single-agent approach
- Production-ready error handling and logging

### Deployment

**Backend**: Hosted on Railway  
**Frontend**: Hosted on Vercel  
**API**: Available at [https://your-api.railway.app](https://your-api.railway.app)
```

### Share Your Demo

Now you have a URL to put:

1. **In your resume**
   - "Live Demo: [link]"
   - Recruiters can click and see it work

2. **In your GitHub README**
   - Professional badge
   - "Try the live demo"

3. **In your LinkedIn**
   - Share the live demo link
   - Impressive to show working project

4. **In interviews**
   - "Let me show you..."
   - Demonstrate in real-time

---

## Environment Variables

### Local Development (.env)
```
ANTHROPIC_API_KEY=sk-ant-your-key
```

### Railway Production
```
ANTHROPIC_API_KEY=sk-ant-your-key
PYTHON_VERSION=3.11
```

### Vercel (if needed)
```
VITE_API_URL=https://multi-agent-api.railway.app
```

---

## Monitoring & Updates

### Monitor Your Apps

**Railway Dashboard**
- See logs in real-time
- Monitor CPU/memory usage
- See deployment history
- Rollback if needed

**Vercel Dashboard**
- See analytics
- Monitor performance
- See deployment logs

### Update Your Code

After Week 4, if you make changes:

```bash
# Local testing
python app/main.py

# Commit and push
git add .
git commit -m "fix: improve agent memory system"
git push origin main

# Railway auto-deploys (watch logs)
# Vercel auto-deploys (watch logs)

# Test live: https://your-demo.com
```

---

## Final Architecture Diagram

```
                        INTERNET
                            ↑
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      GitHub Repo       Railway API       Vercel Frontend
      (Your code)       (Backend)         (Dashboard)
          │                 │                 │
     ┌────┴──────┐      ┌───┴────┐       ┌───┴────┐
     │            │      │         │       │         │
  Deploy       Manage  FastAPI   Claude  HTML/CSS  JS
  History      CI/CD   WebSocket  API    Real-time
```

---

## Troubleshooting Deployed System

### Dashboard won't connect to API

**Check**:
1. Railway backend is running (check logs)
2. WebSocket URL is correct in HTML
3. CORS is enabled (FastAPI has CORS middleware)
4. No firewall blocking WebSocket

**Fix**:
```javascript
// Check browser console (F12)
// Should see WebSocket connection attempt
// Error messages tell you what's wrong

// Common issues:
// "WebSocket connection failed" → Backend not running
// "CORS error" → Check FastAPI CORS config
// "Mixed content" → HTTPs needs wss:// not ws://
```

### API errors

**Check logs in Railway**:
```
Railway Dashboard → Deployments → Latest → Logs
Look for Python errors or API call failures
```

**Test API directly**:
```bash
curl https://your-api.railway.app/api/health
# Should return JSON with status "healthy"
```

### Slow response

**Causes**:
- Claude API is slow (30-60s for complex tasks)
- Railway server restarting (first request is slow)
- Network latency

**Optimize**:
- Keep tasks simple for demo
- Use shorter prompts
- Cache results if possible

---

## Resume/Portfolio Updates

After Week 4 deployment, update your materials:

### Resume Addition

```
Multi-Agent AI System
• Engineered specialized AI agent system for complex task decomposition
• Deployed production-ready FastAPI backend and React dashboard
• Achieved 3.2x performance improvement over single-agent baseline
• Live demo: https://[your-link]
```

### GitHub Profile

Pin your repo with a description:
```
Multi-Agent Collaboration System
Production-grade multi-agent LLM system with real-time dashboard.
FastAPI + Claude + WebSocket. Live demo available.
```

### LinkedIn Post

```
🚀 Just deployed my multi-agent AI system to production!

Built a system where specialized AI agents collaborate:
- Research Agent: Gathers information
- Analyst Agent: Synthesizes insights  
- Writer Agent: Creates content
- Validator Agent: Ensures quality

3.2x faster than single-agent approach
Production-ready with logging, validation, and error handling

Try the live demo: [link]

#AI #LLM #Production #FullStack
```

---

## Week 4 Checklist

### Day 1: Backend Deployment
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Set ANTHROPIC_API_KEY
- [ ] Deploy backend
- [ ] Test /api/health endpoint
- [ ] Get API URL

### Day 2: Frontend Deployment
- [ ] Create Vercel account
- [ ] Create/connect frontend repo
- [ ] Update WebSocket URL to point to Railway
- [ ] Deploy to Vercel
- [ ] Test live demo works
- [ ] Get demo URL

### Day 3: Polish & Documentation
- [ ] Update README with live demo link
- [ ] Test on mobile
- [ ] Update resume with demo link
- [ ] Verify all features work live
- [ ] Check for any console errors

### Day 4: Share & Show
- [ ] Update GitHub profile
- [ ] Post on LinkedIn
- [ ] Send demo link to recruiters
- [ ] Practice demo pitch
- [ ] Share with friends

---

## Cost

**Good news**: Everything is FREE!

- Railway: Free tier includes monthly usage
- Vercel: Free for static sites
- Domain: Can use free vercel.app domain

If you buy custom domain:
- ~$10-15/year typically

---

## After Deployment: You're Done (Almost!)

You now have:
✅ Production system running 24/7
✅ Live demo URL to share
✅ GitHub with clean code
✅ Professional architecture
✅ Performance benchmarks
✅ Interview talking points
✅ Portfolio piece that works

**Result**: Much higher chance of getting interviews and offers.

---

## Next Steps (Week 5-6 Polish)

Optional improvements after deployment:

- [ ] Add more specialized agents
- [ ] Implement parallel execution
- [ ] Add caching for repeated queries
- [ ] Build analytics dashboard
- [ ] Add user authentication
- [ ] Create API documentation (Swagger)
- [ ] Add rate limiting
- [ ] Implement result streaming

But honestly? You're already in a great place for interviews.

---

**Deploy with confidence!** Your system is production-ready. 🚀
