# DevOps Strategy: PrepMate Study Plan Generator

This document outlines the DevOps strategy for the **PrepMate Study Plan Generator**, an intelligent academic planning, scheduling and productivity support platform. The strategy focuses on automation, reliability, and scalability using modern CI/CD practices.

## 1. System Components & Repositories

| Component | Description | Source Code Repository | Technology Stack |
| :--- | :--- | :--- | :--- |
| **Web Application** | Unified Frontend & Backend (API) | `PrepMate-Study_Plan_Generator` (GitHub) | Next.js, React, Node.js, Tailwind CSS |
| **Database** | Persistent Data Store | *Managed Service (No separate repo)* | MongoDB (via MongoDB Atlas) |

## 2. Deployment Architecture

### Location & Hosting
*   **Web Application (Frontend + API)**:
    *   **Platform**: **Vercel** (Recommended for Next.js) or **AWS App Runner** (for containerized approach).
    *   **Strategy**: Serverless/Edge deployment for frontend assets; Serverless functions for API routes.
    *   **Environments**:
        *   **Preview**: Automatically deployed for every Pull Request.
        *   **Production**: Deployed automatically on push to the `main` branch.
*   **Database**:
    *   **Platform**: **MongoDB Atlas** (Cloud Managed).
    *   **Region**: AWS (us-east-1 or closest to user base).
    *   **Backup**: Automated daily snapshots.

## 3. Deployment Pipeline (CI/CD)

We will use **GitHub Actions** for Continuous Integration (CI) and **Vercel Integration** (or GitHub Actions) for Continuous Deployment (CD).

### Pipeline Flow
1.  **Trigger**: Code push to `main` or Pull Request creation.
2.  **CI Phase (Validation)**:
    *   **Checkout Code**: Clone the repository.
    *   **Install Dependencies**: `npm ci` (Clean install).
    *   **Linting**: Run `npm run lint` (ESLint) to ensure code quality.
    *   **Testing**: Run `npm test` (Jest) to execute Unit, Integration, and Component tests.
    *   **Build Check**: Run `npm run build` to verify the application builds without errors.
3.  **CD Phase (Deployment)**:
    *   *If CI passes and branch is `main`:*
    *   Deploy artifacts to Production Environment.
    *   Run post-deployment health checks (e.g., verifying endpoint availability).

## 4. Tests & Checks (Quality Gates)

Before any deployment, the following checks must pass. Failure in any step halts the pipeline.

### A. Static Analysis
*   **Tool**: ESLint
*   **Command**: `npm run lint`
*   **Purpose**: Catch syntax errors, unused variables, and enforce coding standards.

### B. Automated Testing
*   **Tool**: Jest + React Testing Library
*   **Command**: `npm test`
*   **Coverage**:
    *   **Unit Tests**: Validate scheduler algorithms and helper functions (e.g., `__tests__/lib/scheduler.test.js`).
    *   **Integration Tests**: Verify JWT authentication and database interactions.
    *   **Component Tests**: Ensure UI components (like Verified Navbar) render correctly.

### C. Build Verification
*   **Tool**: Next.js Build
*   **Command**: `npm run build`
*   **Purpose**: Ensure all pages, static assets, and API routes compile correctly.

## 5. Tools, Platforms & Libraries

| Category | Tool/Platform | Purpose |
| :--- | :--- | :--- |
| **Source Control** | **GitHub** | Code hosting and version history. |
| **CI/CD** | **GitHub Actions** | Automated testing workflows. |
| **Hosting (App)** | **Vercel** | Hosting Next.js frontend and serverless functions. |
| **Hosting (DB)** | **MongoDB Atlas** | Managed NoSQL database. |
| **Testing** | **Jest** | Test runner and assertion library. |
| **Testing** | **React Testing Library** | Component testing utility. |
| **Linting** | **ESLint** | Static code analysis. |
| **Package Mgmt** | **NPM** | Dependency management. |
| **Monitoring** | **Vercel Analytics** | Real-time performance and usage monitoring. |

---

## 6. DevOps Diagram

```mermaid
graph TD
    subgraph "Developer Environment"
        Dev[Developer]
        Code[Write Code]
        Commit[Commit & Push]
        Dev --> Code --> Commit
    end

    subgraph "Source Control (GitHub)"
        Repo[GitHub Repository]
        PR[Pull Request]
        Main[Main Branch]
        Commit --> Repo
        Repo --> PR
        PR --> Main
    end

    subgraph "CI Pipeline (GitHub Actions)"
        Lint[Linting (ESLint)]
        Test[Unit/Integration Tests (Jest)]
        Build[Build Check (Next.js)]
        
        PR --> Lint
        Main --> Lint
        Lint --> Test
        Test --> Build
    end

    subgraph "CD Pipeline (Vercel)"
        DeployPreview[Deploy Preview Environment]
        DeployProd[Deploy Production]
        
        Build -.->|On PR| DeployPreview
        Build -.->|On Merge to Main| DeployProd
    end

    subgraph "Infrastructure"
        WebApp[Next.js App (Serverless)]
        DB[(MongoDB Atlas)]
        
        DeployProd --> WebApp
        DeployPreview --> WebApp
        WebApp <-->|Read/Write| DB
    end

    style Lint fill:#f9f,stroke:#333
    style Test fill:#f9f,stroke:#333
    style Build fill:#f9f,stroke:#333
    style DeployProd fill:#bbf,stroke:#333
    style DeployPreview fill:#bbf,stroke:#333
    style WebApp fill:#dfd,stroke:#333
    style DB fill:#ff9,stroke:#333
```
