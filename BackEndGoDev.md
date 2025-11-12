
# Complete Go Backend Development Plan
## Educational Platform for Olympiad & Exam Preparation

---

## Table of Contents
1. [Project Goals & Technical Requirements](#1-project-goals--technical-requirements)
2. [Technology Stack & Packages](#2-technology-stack--packages)
3. [Project Structure](#3-project-structure)
4. [Database Models & Schema](#4-database-models--schema)
5. [API Endpoints Specification](#5-api-endpoints-specification)
6. [Implementation Guide](#6-implementation-guide)
7. [High-Quality Prompt for Claude Sonnet 4.5](#7-high-quality-prompt-for-claude-sonnet-45)
8. [Best Practices](#8-best-practices)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment & CI/CD](#10-deployment--cicd)
11. [Future Extensions](#11-future-extensions)

---

## 1. Project Goals & Technical Requirements

### Platform Purpose
Build a scalable, high-performance educational platform for students preparing for olympiads and national exams (ЕГЭ) in:
- Mathematics
- Physics  
- Computer Science (Informatics)

### Core Features
- **Lecture System**: LaTeX-formatted lectures with tagging, filtering, and user notes
- **Task Bank**: Extensive problem database with LaTeX formatting, difficulty levels, topic tags
- **AI Professor**: LLM-powered chat assistant using RAG (Retrieval Augmented Generation) to:
  - Answer questions about lectures and problems
  - Check solutions and provide feedback
  - Recommend study paths based on user progress
  - Update task status and assign points
- **Topic Tree**: Hierarchical navigation of subjects, topics, and subtopics
- **User Analytics**: Comprehensive statistics tracking time spent, tasks solved, progress by topic
- **Progress Assessment**: Automated skill level evaluation based on performance

### Technical Requirements
- **Performance**: Support for thousands of concurrent users
- **Architecture**: API-first design (REST), stateless backend
- **Security**: JWT authentication, role-based access control (RBAC), rate limiting
- **Scalability**: Horizontal scaling capability, low memory footprint
- **Data Format**: Native LaTeX support for mathematical/scientific content

---

## 2. Technology Stack & Packages

### Core Technologies
- **Language**: Go 1.21+ (latest stable)
- **Framework**: Gin (lightweight, fast HTTP web framework)
  - Alternative: Fiber or Echo
- **Database**: PostgreSQL 15+
- **ORM**: GORM v2 (with raw SQL support via sqlx when needed)

### Key Packages

#### Web Framework & Routing
```

github.com/gin-gonic/gin v1.9.1
github.com/gin-contrib/cors
github.com/gin-contrib/sessions

```

#### Database
```

gorm.io/gorm
gorm.io/driver/postgres
github.com/jmoiron/sqlx  // For complex queries

```

#### Authentication & Security
```

github.com/golang-jwt/jwt/v5
golang.org/x/crypto/bcrypt
github.com/ulule/limiter/v3  // Rate limiting

```

#### Validation & Utilities
```

github.com/go-playground/validator/v10
github.com/joho/godotenv  // Environment variables

```

#### API Documentation
```

github.com/swaggo/swag
github.com/swaggo/gin-swagger
github.com/swaggo/files

```

#### Logging
```

go.uber.org/zap  // High-performance logging
// Alternative: github.com/rs/zerolog

```

#### Testing
```

github.com/stretchr/testify
net/http/httptest

```

#### LLM Integration (for AI Professor)
```

// Use HTTP client for OpenAI/Anthropic APIs
// Or integrate with local models via HTTP/gRPC

```

---

## 3. Project Structure

```

coolphy-backend/
├── cmd/
│   └── server/
│       └── main.go                 \# Application entrypoint
├── pkg/
│   ├── api/
│   │   ├── handlers/               \# HTTP request handlers
│   │   │   ├── auth.go
│   │   │   ├── lectures.go
│   │   │   ├── tasks.go
│   │   │   ├── topics.go
│   │   │   ├── solutions.go
│   │   │   ├── professor.go
│   │   │   ├── notifications.go
│   │   │   ├── admin.go
│   │   │   └── profile.go
│   │   ├── middleware/             \# Custom middlewares
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   ├── logger.go
│   │   │   ├── rate_limit.go
│   │   │   └── rbac.go
│   │   └── routes/                 \# Route definitions
│   │       └── router.go
│   ├── models/                     \# Database models
│   │   ├── user.go
│   │   ├── lecture.go
│   │   ├── task.go
│   │   ├── topic.go
│   │   ├── solution_attempt.go
│   │   ├── note.go
│   │   ├── chat_message.go
│   │   └── notification.go
│   ├── services/                   \# Business logic
│   │   ├── auth_service.go
│   │   ├── lecture_service.go
│   │   ├── task_service.go
│   │   ├── topic_service.go
│   │   ├── analytics_service.go
│   │   ├── professor_service.go    \# LLM integration
│   │   └── notification_service.go
│   ├── db/                         \# Database layer
│   │   ├── connection.go
│   │   ├── migrations.go
│   │   └── transaction.go
│   └── utils/                      \# Utility functions
│       ├── password.go
│       ├── jwt.go
│       ├── validation.go
│       └── response.go
├── internal/                       \# Internal packages
│   └── config/
│       └── config.go               \# Configuration management
├── docs/                           \# API documentation
│   ├── swagger.yaml
│   └── README.md
├── test/                           \# Tests
│   ├── integration/
│   └── unit/
├── migrations/                     \# Database migrations
│   ├── 001_initial_schema.sql
│   └── ...
├── .env.example                    \# Environment variables template
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── Makefile                        \# Build automation
├── go.mod
├── go.sum
└── README.md

```

---

## 4. Database Models & Schema

### User Model
```

type User struct {
ID              uint      `gorm:"primaryKey" json:"id"`
Email           string    `gorm:"uniqueIndex;not null" json:"email"`
Name            string    `gorm:"not null" json:"name"`
PasswordHash    string    `gorm:"not null" json:"-"`
Points          int       `gorm:"default:0" json:"points"`
Subjects        pq.StringArray `gorm:"type:text[]" json:"subjects"` // [math, physics, cs]
Role            string    `gorm:"default:'user'" json:"role"` // user, admin
Achievements    JSONB     `gorm:"type:jsonb" json:"achievements"`
Settings        JSONB     `gorm:"type:jsonb" json:"settings"`
CreatedAt       time.Time `json:"created_at"`
UpdatedAt       time.Time `json:"updated_at"`

    // Relations
    SolutionAttempts []SolutionAttempt `gorm:"foreignKey:UserID"`
    Notes            []Note            `gorm:"foreignKey:UserID"`
    ChatMessages     []ChatMessage     `gorm:"foreignKey:UserID"`
    Notifications    []Notification    `gorm:"foreignKey:UserID"`
    }

```

### Lecture Model
```

type Lecture struct {
ID              uint      `gorm:"primaryKey" json:"id"`
Title           string    `gorm:"not null" json:"title"`
Subject         string    `gorm:"not null;index" json:"subject"` // math, physics, cs
ContentLaTeX    string    `gorm:"type:text;not null" json:"content_latex"`
Summary         string    `gorm:"type:text" json:"summary"`
Tags            pq.StringArray `gorm:"type:text[]" json:"tags"`
Level           string    `gorm:"default:'basic'" json:"level"` // basic, advanced, olympiad
AuthorID        uint      `json:"author_id"`
ViewCount       int       `gorm:"default:0" json:"view_count"`
Status          string    `gorm:"default:'active'" json:"status"` // active, draft, archived
CreatedAt       time.Time `json:"created_at"`
UpdatedAt       time.Time `json:"updated_at"`

    // Relations
    Topics          []Topic   `gorm:"many2many:lecture_topics;"`
    RelatedTasks    []Task    `gorm:"many2many:lecture_tasks;"`
    Notes           []Note    `gorm:"foreignKey:LectureID"`
    }

```

### Task Model
```

type Task struct {
ID                  uint      `gorm:"primaryKey" json:"id"`
Title               string    `gorm:"not null" json:"title"`
DescriptionLaTeX    string    `gorm:"type:text;not null" json:"description_latex"`
Subject             string    `gorm:"not null;index" json:"subject"`
Tags                pq.StringArray `gorm:"type:text[]" json:"tags"`
Level               string    `gorm:"not null" json:"level"` // 1-10 or basic/advanced/olympiad
Type                string    `gorm:"not null" json:"type"` // ege, olympiad, practice
CorrectAnswer       string    `gorm:"type:text" json:"-"` // Hidden from regular users
SolutionLaTeX       string    `gorm:"type:text" json:"solution_latex"`
HintLaTeX           string    `gorm:"type:text" json:"hint_latex"`
Points              int       `gorm:"default:10" json:"points"`
Status              string    `gorm:"default:'active'" json:"status"`
CreatedAt           time.Time `json:"created_at"`
UpdatedAt           time.Time `json:"updated_at"`

    // Relations
    Topics              []Topic           `gorm:"many2many:task_topics;"`
    RelatedLectures     []Lecture         `gorm:"many2many:lecture_tasks;"`
    SolutionAttempts    []SolutionAttempt `gorm:"foreignKey:TaskID"`
    }

```

### Topic Model (Tree Structure)
```

type Topic struct {
ID          uint      `gorm:"primaryKey" json:"id"`
Title       string    `gorm:"not null" json:"title"`
Subject     string    `gorm:"not null;index" json:"subject"`
Description string    `gorm:"type:text" json:"description"`
ParentID    *uint     `gorm:"index" json:"parent_id"` // Nullable for root nodes
Level       int       `gorm:"default:0" json:"level"` // Depth in tree
OrderIndex  int       `gorm:"default:0" json:"order_index"` // For sorting
CreatedAt   time.Time `json:"created_at"`
UpdatedAt   time.Time `json:"updated_at"`

    // Relations
    Parent      *Topic    `gorm:"foreignKey:ParentID"`
    Children    []Topic   `gorm:"foreignKey:ParentID"`
    Lectures    []Lecture `gorm:"many2many:lecture_topics;"`
    Tasks       []Task    `gorm:"many2many:task_topics;"`
    }

```

### SolutionAttempt Model
```

type SolutionAttempt struct {
ID              uint      `gorm:"primaryKey" json:"id"`
UserID          uint      `gorm:"not null;index" json:"user_id"`
TaskID          uint      `gorm:"not null;index" json:"task_id"`
Answer          string    `gorm:"type:text;not null" json:"answer"`
SolutionText    string    `gorm:"type:text" json:"solution_text"`
Status          string    `gorm:"default:'pending'" json:"status"` // correct, incorrect, pending
PointsAwarded   int       `gorm:"default:0" json:"points_awarded"`
AIFeedback      string    `gorm:"type:text" json:"ai_feedback"`
TimeSpent       int       `gorm:"default:0" json:"time_spent"` // seconds
CreatedAt       time.Time `json:"created_at"`
UpdatedAt       time.Time `json:"updated_at"`

    // Relations
    User            User      `gorm:"foreignKey:UserID"`
    Task            Task      `gorm:"foreignKey:TaskID"`
    }

```

### Note Model
```

type Note struct {
ID          uint      `gorm:"primaryKey" json:"id"`
UserID      uint      `gorm:"not null;index" json:"user_id"`
LectureID   uint      `gorm:"not null;index" json:"lecture_id"`
Content     string    `gorm:"type:text;not null" json:"content"`
CreatedAt   time.Time `json:"created_at"`
UpdatedAt   time.Time `json:"updated_at"`

    // Relations
    User        User      `gorm:"foreignKey:UserID"`
    Lecture     Lecture   `gorm:"foreignKey:LectureID"`
    }

```

### ChatMessage Model (AI Professor)
```

type ChatMessage struct {
ID              uint      `gorm:"primaryKey" json:"id"`
UserID          uint      `gorm:"not null;index" json:"user_id"`
ContextType     string    `json:"context_type"` // lecture, task, topic, general
ContextID       *uint     `json:"context_id"` // ID of lecture/task/topic
UserMessage     string    `gorm:"type:text;not null" json:"user_message"`
AIReply         string    `gorm:"type:text" json:"ai_reply"`
Timestamp       time.Time `json:"timestamp"`

    // Relations
    User            User      `gorm:"foreignKey:UserID"`
    }

```

### Notification Model
```

type Notification struct {
ID          uint      `gorm:"primaryKey" json:"id"`
UserID      uint      `gorm:"not null;index" json:"user_id"`
Type        string    `gorm:"not null" json:"type"` // achievement, new_content, reminder
Title       string    `gorm:"not null" json:"title"`
Content     string    `gorm:"type:text" json:"content"`
IsRead      bool      `gorm:"default:false" json:"is_read"`
Create

