# Plan.Works

A web app for marking up architectural drawings with UK-standard electrical symbols. Drag and drop sockets, switches, lights, detectors and fixtures onto an imported PDF or image of a floor plan.

---

## What this is

A Next.js project ready to deploy to Vercel. Everything you have in the chat artifact, but as a real web app you can host at your own URL, use on any device, and share with others.

## Run it on your machine first

Before deploying, get it running locally so you know it works.

### 1. Install Node.js

Download the LTS version from https://nodejs.org and run the installer. To check it worked, open a terminal (Terminal on Mac, PowerShell on Windows) and type:

```
node --version
npm --version
```

Both should print version numbers.

### 2. Install dependencies

In the terminal, navigate to this folder:

```
cd path/to/planworks
npm install
```

This downloads everything needed (a few hundred MB into a `node_modules` folder — that's normal).

### 3. Start the dev server

```
npm run dev
```

Open http://localhost:3000 in your browser. The app should load. Drop a PDF or image on the canvas, drag a few symbols onto it. If it works, you're ready to deploy.

Press `Ctrl+C` in the terminal to stop the dev server.

---

## Deploy to Vercel

### 1. Create accounts

- **GitHub** — https://github.com/signup. Pick a username (will appear in your repo URL).
- **Vercel** — https://vercel.com/signup. Choose "Continue with GitHub" so the two link automatically.

### 2. Install Git

Mac/Linux usually have it. Check by typing `git --version`. If not, install from https://git-scm.com/downloads.

### 3. Push the project to GitHub

In the project folder:

```
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repo on GitHub (https://github.com/new — just give it a name, leave everything else default, click "Create repository"). GitHub will show you a URL like `https://github.com/yourname/planworks.git`. Copy it.

Back in your terminal:

```
git remote add origin https://github.com/yourname/planworks.git
git branch -M main
git push -u origin main
```

You'll be prompted to authenticate. Modern GitHub uses a personal access token instead of a password — easiest is to install the GitHub CLI (`brew install gh` on Mac, or from https://cli.github.com) and run `gh auth login`. After that, `git push` just works.

### 4. Connect Vercel

- Go to https://vercel.com/new
- It'll show your GitHub repos. Click "Import" next to `planworks`
- Leave all settings at default (Vercel auto-detects Next.js)
- Click **Deploy**

About 60 seconds later, you'll have a live URL like `planworks-yourname.vercel.app`. That's your app.

### 5. Future updates

After the initial deploy, every time you (or I) push code to the GitHub repo, Vercel automatically rebuilds and updates the live site. No further deploy steps needed.

```
git add .
git commit -m "Describe what changed"
git push
```

---

## Custom domain

Once it's live, in the Vercel dashboard go to your project → Settings → Domains. Add a domain you own and follow the DNS instructions. Free to add, takes a few minutes to propagate.

---

## How storage works (current state)

Right now, projects save to your browser's **localStorage**. This means:

- Your work persists across refreshes and browser closes
- It's tied to that specific browser on that specific device
- If you clear browser data, it's gone

For real cloud storage (sync across devices, share plans), we'd add a database (Vercel Postgres is free up to a generous limit). That's a follow-up task — not blocking deployment.

---

## Project structure

```
planworks/
├── app/                       # Next.js routes
│   ├── layout.jsx             # Root HTML wrapper
│   ├── page.jsx               # Home page (loads the tool)
│   └── globals.css            # Tailwind imports
├── components/
│   └── ElectricalPlanTool.jsx # The actual tool (~1100 lines)
├── lib/
│   └── storage.js             # localStorage adapter
├── package.json               # Dependencies
├── next.config.js             # Next.js config
├── tailwind.config.js         # Tailwind config
├── tsconfig.json              # TypeScript (lenient)
└── README.md                  # This file
```

---

## What's coming next

Things we've talked about adding:
- PNG/PDF export of the marked-up plan
- Snap-to-grid + alignment guides
- Multi-select and copy/paste
- Scale calibration (set real-world distances)
- Multiple projects (currently just one auto-saved)
- Cloud sync via Vercel Postgres

Each is a focused session.
