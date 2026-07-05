# SOW Generator

AI-powered Scheme of Work generator for Mauritius secondary schools (Grades 7–13).

Built with React + Vite, deployed on Vercel with a serverless API route.

## Features
- Generate new SOWs using Claude AI
- Convert existing SOWs between Excel, Word, and PDF formats
- Supports Grades 7–13 with Mauritius-specific curriculum (NYCBE, O Level/SC, A Level/HSC)
- Upload reference documents: template, existing SOWs, syllabus, textbook, output style
- Per-term week configuration including Full Year mode

## Setup

### 1. Clone and install
```bash
git clone https://github.com/dpkspace-code/sow-generator
cd sow-generator
npm install
```

### 2. Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variable: `ANTHROPIC_API_KEY` = your Anthropic API key
4. Deploy

### Local development
```bash
# Create .env.local
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local

# Run dev server
npm run dev
```

## Project structure
```
sow-generator/
├── api/
│   └── generate.js      # Vercel serverless function (calls Anthropic API)
├── src/
│   ├── pages/
│   │   ├── GeneratePage.jsx
│   │   └── ConvertPage.jsx
│   ├── components/
│   │   ├── Card.jsx
│   │   ├── FileUpload.jsx
│   │   └── FormatPicker.jsx
│   ├── data.js           # Curriculum data + shared utilities
│   ├── builders.js       # Excel/Word/Print output builders
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```
