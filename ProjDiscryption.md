## CoolPhy — Next-Gen Competitive Math, Physics \& CS Preparation Platform

### Vision \& Core Principles

CoolPhy is a cutting-edge, scalable web platform designed for high school students (grades 9–11), olympiad contenders, and university applicants seeking to master math, physics, and computer science. The project aims to bridge exam-focused drill (such as the Russian Unified State Exam, ЕГЭ/ОГЭ) and olympiad-level creative problem-solving through state-of-the-art technology, a rich knowledge base, and personalized AI-driven guidance.

Key principles include:

- **API-first architecture**: Complete separation of backend and frontend, deployable at scale.
- **Deep LLM integration**: An AI “Professor” assistant, powered by RAG (Retrieval Augmented Generation), who can auto-check answers, provide hints, analyze mistakes, and adapt recommendations.
- **Gamification and progress tracking**: Motivation through points, achievements, competitive stats, and visualized learning trajectories.
- **Modular extensibility**: Easily expandable to new schools, subjects, and task formats; embeddable into e-learning ecosystems.

***

### Main Features \& Unique Concepts

#### 1. Knowledge Base: Lectures and Notes

- **Full-text lecture repository**: All lectures and notes are written in LaTeX for mathematical rigor and easy scientific formatting.
- **Semantic tagging**: Each lecture includes a set of tags (curriculum topic, olympiad type, exam section, techniques, difficulty level) for fine-grained retrieval and guided navigation.
- **Linked lecture–task graph**: Direct links between lectures and related problems foster targeted revision and context reinforcement.
- **Embedding support**: Each lecture/content element stores vector embeddings for efficient semantic search and the AI’s RAG model context window.


#### 2. Task Database \& Solution Engine

- **Tasks in LaTeX**: Full support for advanced formatting and scientific notation for both statement and solution.
- **Comprehensive metadata**:
    - **Multi-tagged**: Topic, type (EGE, olympiad, theory, practice), difficulty (1–10), relevant techniques.
    - **Single answer field**: Streamlined UI/UX for entering diverse answer types (number, text, mathematical expression, multiple choice).
- **SolutionAttempt model**: Records each user’s try, capturing time spent, AI feedback, score, system evaluation, and confidence metric.


#### 3. AI Professor — LLM Agent (RAG-Enhanced)

- **Conversational assistant**: The user can ask questions about any task, topic, or their own mistakes and progress.
- **Personalized feedback and guidance**:
    - Checks user’s answers and provides detailed feedback (correct, incorrect, partially correct).
    - Offers hints, points out mistakes, and recommends specific lectures or topics (“You might want to review Differentiation”).
    - Auto-assigns scores and can update the task status to “solved” or “in progress.”
- **Transparency \& context**: Every AI response cites the sections and problems from which it draws explanations (RAG context log).
- **LLM tool calling**: Supports dynamic tools for searching lectures, evaluating solutions, and retrieving theory.


#### 4. Topical Navigation \& Knowledge Tree

- **Topic tree (“Древо тем”):** Fully treelike structure representing all curriculum areas, olympiad topics, and subtypes, e.g., “Math → Algebra → Quadratic Equations.”
- **Multi-dimensional browsing**: Users can navigate by subject, complexity, exam format, or thematic clusters, easily discovering related tasks and lectures.
- **Auto-linking**: Each node in the tree displays all attached lectures and tasks dynamically based on tags and metadata.


#### 5. Personal Statistics and Progress Tracking

- **Visual dashboards**: Real-time charts showing problem count, topics covered, accuracy per theme, and time spent.
- **Preparation level**: Smart assessment of user level (“beginner,” “intermediate,” “olympiad”) — based on performance analytics and AI scoring.
- **Weakness detection**: The system tracks and highlights weak topics, recommends adaptive study plans, and visualizes learning gaps.
- **Gamification**: Badges, leaderboards, personal streaks, and reminders drive continuous engagement.

***

### Technical Architecture (Summary)

- **Backend**: Go (Gin framework), PostgreSQL (with JSONB, array types, fulltext search, and vector store support via embedding service).
- **Frontend**: React/Next.js with TypeScript, supporting modern UI/UX patterns and SSR.
- **LLM Integration**: OpenRouter API (Claude 3.5 Sonnet, GPT-4, o1 and future models), with Python microservice for RAG pipeline (LangChain/Haystack).
- **Authentication**: JWT + OAuth2 for security and social logins.
- **Infrastructure**: Docker, docker-compose for local/dev, Kubernetes or Railway/DigitalOcean for scalable cloud deployment.

***

### Future Direction \& Expansion Ideas

- **Collaborative features**: Peer-to-peer challenge mode, group study, and shared progress dashboards.
- **Offline support + mobile**: PWA functionality for prep on the go.
- **Content contributions**: Admin/editor panel for teachers and top users to submit and curate new lectures/tasks.
- **AI ethics and interpretability**: Explanations and “learning pathways” in plain language, transparency logs for any automated grading or suggestion.

***

**CoolPhy sets a new standard for algorithmically personalized olympiad and exam prep, combining trusted pedagogy with next-gen AI for both everyday learners and regional/national champions.**
This concept can serve as both an advanced individual learning tool and a foundation for full-school or university-scale knowledge management systems.

