<div align="center">

# 🌐 CODEATLAS
### *AI-Powered Repository Intelligence & Interactive Architecture Mapping*

[![License: MIT](https://img.shields.io/badge/License-MIT-38f2c2.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Status: Free & Open](https://img.shields.io/badge/Access-100%25%20Free%20Unlocked-7cf7a5.svg?style=for-the-badge)](#)
[![Database: Zero-DB](https://img.shields.io/badge/Database-Zero--DB%20Standalone-ffc857.svg?style=for-the-badge)](#)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg?style=for-the-badge)](#)
[![Backend: Node.js + Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-68a063.svg?style=for-the-badge)](#)

<p align="center">
  <b>Turn complex GitHub repositories into interactive, living dependency maps. Predict blast radius before changing code, chat with an AI architect, and refactor files on the fly.</b>
</p>

> *"The best way to predict the future is to create it. Write clean code, dream big, and never stop building."*  
> — **Created with dedication by [Sadashiv Gawade](https://github.com/SadashivGawade321)**

</div>

---

## 🌟 Why CodeAtlas?

When inheriting unfamiliar codebases or refactoring large systems, developers often struggle to visualize how files, modules, and components interact. **CodeAtlas** solves this with zero setup:
- 🚀 **Zero Barrier to Entry**: No signup, no login walls, and no database configuration required.
- ⚡ **Instant Architecture Visualization**: Paste any public GitHub repo URL and generate interactive dependency graphs in seconds.
- 🎯 **Predict Blast Radius**: Pinpoint every downstream dependency that could break before committing a change.
- 🧠 **AI-Powered Insights**: Chat with an AI repository architect, trigger automated code reviews, and generate sequence diagrams on demand.

---

## 🏗️ Architecture & Workflow

```mermaid
flowchart TD
    User([Developer / User]) -->|1. Paste GitHub Repo URL| Dashboard[Dashboard Console]
    Dashboard -->|2. POST /api/repo/analyze| ParserService[Parser & Tree Service]
    
    subgraph Backend Engine ["CodeAtlas Standalone Backend"]
        ParserService -->|3. Fetch GitHub Git Tree| GitHubAPI[GitHub REST API]
        GitHubAPI -->|4. Return File Tree & AST| ParserService
        ParserService -->|5. Compute Graph & Metrics| GraphEngine[Graph Clustering Engine]
        GraphEngine -->|6. Cache in Memory| MemoryStore[(In-Memory Cache)]
        
        AIService[AI Service - Groq / Gemini] <-->|Contextual Prompts| MemoryStore
    end
    
    Dashboard -->|7. Load Interactive Graph| RepoView[Repository Graph View]
    
    subgraph Interactive Capabilities ["Live Graph & AI Tools"]
        RepoView --> Layouts[5 Dynamic Cytoscape Layouts]
        RepoView --> BlastRadius[Blast Radius Analysis]
        RepoView --> AIChat[AI Architect Chat + Mermaid Diagrams]
        RepoView --> AIRefactor[Autonomous Code Refactor]
        RepoView --> Multiplayer[Real-time Cursor Tracking - Socket.io]
    end
    
    Dashboard -.->|Persistent Client Storage| LocalStorage[(Browser LocalStorage)]
```

---

## 🚀 Key Features

### 1. 🗺️ Interactive Graph Explorer
* Powered by **Cytoscape.js** with 5 dynamic layout modes: *Force-Directed (CoSE), Grid, Circle, Hierarchical (Breadthfirst), and Concentric*.
* Color-code nodes by folder, architectural layer, or churn rate.
* Search, zoom, pan, and isolate subgraphs with smooth spring animations.

### 2. 💥 Multi-Hop Blast Radius & Risk Hotspots
* Click any file node to immediately highlight its direct imports and downstream dependents.
* Calculate health scores based on coupling density, isolated modules, and circular dependencies.

### 3. 🤖 AI Architect Chat & Mermaid Diagrams
* Context-aware AI assistant answers structural questions about your codebase.
* Automatically renders responsive flowcharts and sequence diagrams directly in chat via Mermaid.js.

### 4. 🛠️ Autonomous Refactoring & Code Review
* Select any source file to inspect issues (security risks, performance bottlenecks, code smells).
* One-click autonomous refactor generates clean, modernized code comparisons with side-by-side diffs.

### 5. 👥 Multiplayer Real-Time Collaboration
* Connected developers can collaborate in the same graph room via **Socket.io**.
* Displays live remote cursors, coordinates, and real-time interaction.

### 6. 🔓 100% Free & Standalone (Zero-DB)
* Does not require MongoDB or any external database.
* Scans and user preferences persist locally in your browser's `localStorage` for complete data privacy.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Cytoscape.js, Mermaid.js, KaTeX, Chart.js |
| **Backend** | Node.js, Express.js, Socket.io, Acorn (JS AST Parser), Axios |
| **AI Engine** | Groq API (High-speed Llama/Mixtral) with Google Gemini 2.5 Flash Fallback |
| **Deployment** | Netlify (Frontend SPA), Render / Railway (Backend API) |

---

## 📋 Sequence Diagram: Analysis Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Client as CodeAtlas Frontend
    participant Server as Node.js Backend
    participant GH as GitHub API
    participant AI as AI Engine (Groq/Gemini)

    Dev->>Client: Enters GitHub URL
    Client->>Server: POST /api/repo/analyze { url }
    Server->>GH: GET /repos/{owner}/{repo}/git/trees
    GH-->>Server: File hierarchy & file blobs
    Server->>Server: Parse AST, detect imports & circular paths
    Server->>Server: Cache graph in memory
    Server-->>Client: Return nodes, edges & health metrics
    Client->>Dev: Render interactive architecture canvas
    
    opt Ask Architecture Question
        Dev->>Client: "Show authentication workflow"
        Client->>Server: POST /api/repo/chat/:id
        Server->>AI: Send prompt + graph node context
        AI-->>Server: Response with ```mermaid diagram
        Server-->>Client: Stream markdown & render Mermaid chart
    end
```

---

## ⚡ Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/SadashivGawade321/codeatlas.git
cd codeatlas
```

### 2. Configure Backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5000
# Optional AI keys (Groq is recommended for ultra-fast chat):
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
npm run dev
# Server will run on http://localhost:5000
```

### 3. Configure Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

Visit `http://localhost:5173` in your browser and start mapping repositories!

---

## 🚢 Deployment

### Frontend (Netlify)
1. Push repository to GitHub.
2. Link the repository on [Netlify](https://netlify.com).
3. Build Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Set environment variable: `VITE_API_URL=https://your-backend-url.onrender.com`

### Backend (Render / Railway)
1. Create a new Web Service on [Render](https://render.com).
2. Set root directory to `backend`.
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add your `GROQ_API_KEY` or `GEMINI_API_KEY` in Render environment variables.

---

## 👤 Author & Philosophy

<div align="center">

### Built with Passion & Dedication by **Sadashiv Gawade**

*"Code is poetry written with logic. Strive to build tools that empower fellow developers to think clearer, build faster, and innovate fearlessly."*

[![GitHub](https://img.shields.io/badge/GitHub-SadashivGawade321-181717?style=flat-square&logo=github)](https://github.com/SadashivGawade321)

</div>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, customize, and share!
