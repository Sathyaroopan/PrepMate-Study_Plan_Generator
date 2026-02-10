# Comprehensive DevOps Strategy & Implementation Plan: PrepMate Study Plan Generator

## 1. Executive Summary

This document serves as the definitive reference for the DevOps strategy, architecture, and operational procedures for the **PrepMate Study Plan Generator**. As an intelligent academic planning scheduler, PrepMate requires a robust, scalable, and secure infrastructure to handle user data, generate AI-driven schedules, and ensure high availability.

The strategy encompasses the entire software development lifecycle (SDLC), from local development to production deployment, leveraging industry-standard tools like **GitHub**, **Next.js**, **Vercel**, and **MongoDB Atlas**.

---

## 2. System Architecture & Components

### 2.1 High-Level Architecture
The application follows a modern serverless architecture, minimizing operational overhead while maximizing scalability.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Next.js) | Server-Side Rendered (SSR) & Static Site Generation (SSG) for performance. |
| **Backend API** | Node.js (Next.js API Routes) | Serverless functions handling business logic, authentication, and AI processing. |
| **Database** | MongoDB (Atlas) | Managed NoSQL document store for user profiles, courses, and schedules. |
| **Authentication** | JWT (JSON Web Tokens) | Stateless authentication mechanism securely stored in HTTP-only cookies. |
| **Styling** | Tailwind CSS | Utility-first CSS framework for rapid UI development. |
| **Testing** | Jest + React Testing Library | Comprehensive testing suite for reliability. |


## 3. Source Code Management (SCM) Strategy

### 3.1 Repository Structure
*   **Repo**: `PrepMate-Study_Plan_Generator`
*   **Host**: GitHub
*   **Visibility**: Private (during development), Public (release)

### 3.2 Branching Strategy: GitFlow (Simplified)
We adopt a simplified GitFlow workflow to maintain stability while allowing rapid feature development.

*   **`main`**: The production-ready branch. deployed to Production environment. Protected; direct pushes are disabled.
*   **`develop`** (Optional): Integration branch for features before they hit main.
*   **`feature/*`**: Short-lived branches for specific features or fixes (e.g., `feature/login-page`, `fix/scheduler-bug`).
*   **`hotfix/*`**: Critical fixes for production issues, merged directly to `main` and back-ported.

### 3.3 Pull Request (PR) Policy
All changes to `main` must come via Pull Requests.
*   **Reviewers**: At least 1 peer review required.
*   **Status Checks**: All CI checks (Lint, Test, Build) must pass.
*   **Squash & Merge**: Recommended to keep the main history clean.

### 3.4 Commit Convention
Standardized commit messages ensure readable history and can automate changelogs.
Format: `type(scope): subject`

*   `feat`: A new feature
*   `fix`: A bug fix
*   `docs`: Documentation only changes
*   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
*   `refactor`: A code change that neither fixes a bug nor adds a feature
*   `perf`: A code change that improves performance
*   `test`: Adding missing tests or correcting existing tests
*   `chore`: Changes to the build process or auxiliary tools and libraries

---

## 4. Environments Strategy

To ensure code quality and prevent regressions, we utilize multiple environments.

| Environment | Purpose | URL Pattern | Deployment Trigger |
| :--- | :--- | :--- | :--- |
| **Local** | Developer's machine for coding and initial testing. | `localhost:3000` | Manual (`npm run dev`) |
| **Preview** | Ephemeral environment for every PR to test changes in isolation. | `*-git-*.vercel.app` | Push to any branch (except main) |
| **Production** | Live environment for end-users. | `prepmate.vercel.app` | Merge to `main` |

---

## 5. Continuous Integration (CI) Pipeline

The CI pipeline runs on **GitHub Actions**. It ensures that every commit is verified before it can be merged.

### 5.1 CI Workflow Configuration
File: `.github/workflows/ci.yml`

```yaml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    name: Validate, Lint & Test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x] # Test against LTS versions

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Check for Duplicate Dependencies
        run: npm dedupe

      - name: Lint Code (ESLint)
        run: npm run lint
        # Fails if there are any linting errors

      - name: Check Formatting (Prettier)
        run: npx prettier --check .
        continue-on-error: true # Warning only for formatting
        
      - name: Run Unit & Integration Tests (Jest)
        run: npm test -- --coverage
        env:
          CI: true

      - name: Upload Test Coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build-check:
    name: Verify Production Build
    needs: validate
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Build Application
        run: npm run build
        env:
          # Mock env vars needed for build (if any)
          NEXT_PUBLIC_API_URL: "http://localhost:3000"
          MONGODB_URI: "mongodb://mock-uri-for-build-check"
```

---

## 6. Continuous Deployment (CD) Pipeline

Deployment is handled automatically by the **Vercel Platform Enterprise** integration for GitHub.

### 6.1 Vercel Configuration
File: `vercel.json` (Recommended configuration)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "regions": ["ias1"], 
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 6.2 Deployment Triggers
1.  **Preview Deployments**: Triggered automatically when a Pull Request is opened or updated. Vercel adds a comment to the PR with the live URL.
2.  **Production Deployments**: Triggered automatically when a commit is pushed to the `main` branch.

### 6.3 Database Migrations
Since MongoDB is schemaless, heavy migrations are rare. However, for data consistency:
*   Use script-based migrations (e.g., using `migrate-mongo` or standalone Node scripts) executed manually or as a GitHub Action step *before* the deployment step if schema validation rules change significantly.

---

## 7. Testing Strategy

A multi-layered testing strategy ensures reliability.

### 7.1 Unit Testing (Jest)
*   **Scope**: Individual functions, scheduling algorithms (`src/lib/scheduler.js`), utility helpers.
*   **Goal**: Ensure logic correctness in isolation.
*   **Threshold**: Minimum 80% code coverage.

### 7.2 Integration Testing (Jest + Supertest/RTL)
*   **Scope**: API endpoints, Database interactions, Component interactions.
*   **Goal**: Ensure modules work together (e.g., Scheduler reads from Database correctly).

### 7.3 Component Testing (React Testing Library)
*   **Scope**: React components (`Navbar`, `Sidebar`, `Dashboard`).
*   **Goal**: Verify UI renders correctly based on props and user events.

### 7.4 End-to-End (E2E) Testing (Proposed: Playwright)
*   *Future Implementation*
*   **Scope**: Critical user flows (Signup -> Login -> Generate Schedule -> View Dashboard).
*   **Goal**: Verify the entire system from a user's perspective.

### 7.5 Automated Security Testing
*   **SCA (Software Composition Analysis)**: `npm audit` runs in CI to check for known vulnerabilities in dependencies.
*   **SAST (Static Application Security Testing)**: CodeQL (GitHub Advanced Security) can be enabled to scan for security flaws in code.

---

## 8. Infrastructure & Configuration Management

### 8.1 Environment Variables
Sensitive configuration is strictly separated from code.
*   **Local**: Stored in (`.env.local`). **Never committed to Git**.
*   **CI**: Stored in GitHub Repository Secrets.
*   **Production/Preview**: Stored in Vercel Project Settings (Environment Variables).

| Variable Key | Description | Sensitivity |
| :--- | :--- | :--- |
| `MONGODB_URI` | Connection string for MongoDB Atlas | High |
| `JWT_SECRET` | Secret key for signing session tokens | High |
| `NEXT_PUBLIC_Analytics_ID` | Public ID for tracking (if used) | Low |

### 8.2 Database Management (MongoDB Atlas)
*   **Cluster Tier**: M0 (Free Tier) to M10 (Production).
*   **Network Access**: IP Whitelisting enabled. Only Vercel IPs and Developer VPNs allowed.
*   **Backups**: 
    *   Continuous Cloud Backups (Point-in-time recovery).
    *   Daily Snapshots retained for 30 days.

---

## 9. Operations & Monitoring

### 9.1 Observability
*   **Logs**: Vercel Runtime Logs provide real-time stream of serverless function execution.
*   **Performance**: Vercel Analytics (Web Vitals) tracks LCP, FID, CLS scores from real users.
*   **Error Tracking**: (Recommended) Integrate **Sentry** or **LogRocket** for catching unhandled exceptions in frontend and backend.

### 9.2 Incident Management
1.  **Detection**: Alert from Monitoring tool or User Report.
2.  **Triage**: Severity assessment (P0 - Down, P1 - Critical Bug, P2 - Minor).
3.  **Resolution**: 
    *   If code issue: Hotfix branch -> PR -> Merge -> Auto Deploy.
    *   If bad deploy: use **Vercel Instant Rollback** to revert to previous deployment (1 click).

### 9.3 Runbook: Emergency Rollback
In case of a critical failure after a deployment:
1.  Login to Vercel Dashboard.
2.  Navigate to "Deployments" tab.
3.  Find the last known good deployment (the one before the current broken one).
4.  Click the "three dots" menu -> "Redeploy" or "Promote to Production".
5.  Verify the production URL is working.
6.  Investigate the cause in the broken commit on a separate branch.

---

## 10. Security Best Practices

| Domain | Practice | Implementation |
| :--- | :--- | :--- |
| **Authentication** | Secure Session Management | HTTP-only, Secure, SameSite cookies for JWTs. Prevent XSS access to tokens. |
| **Input Validation** | Sanitize all inputs | Use `zod` or `joi` schemas for API payloads to prevent Injection attacks. |
| **Access Control** | Role-Based Access (RBAC) | Middleware (`middleware.js`) protects `/dashboard` and API routes. |
| **Dependencies** | Regular Updates | Weekly `npm update` and automated Dependabot PRs. |
| **Transport** | Encryption in Transit | Enforce HTTPS (HSTS) on all connections (Vercel default). |

## 11. Conclusion

This DevOps strategy provides a solid foundation for the PrepMate application. By leveraging managed services and automated pipelines, the development team can focus on feature delivery rather than infrastructure maintenance. As the project grows, this strategy allows for easy expansion into more complex architectures, such as microservices or containerization (Docker/Kubernetes), with minimal friction.
