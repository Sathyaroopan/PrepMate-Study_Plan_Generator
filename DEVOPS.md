# DevOps Documentation

This document provides a comprehensive overview of the DevOps, CI/CD pipelines, and infrastructure setup for the **PrepMate** project. The goal of this setup is to ensure code quality, automate testing, and provide seamless, zero-downtime deployments.

---

## 🏗️ Architecture Overview

The DevOps pipeline is built around two core providers:
1. **GitHub Actions**: Handles Continuous Integration (CI) – compiling code, enforcing style guidelines, and running automated tests.
2. **Vercel**: Handles Continuous Deployment (CD) – automatically building and serving the Next.js application globally via Vercel's Edge Network.

---

## 🔄 Continuous Integration (CI)

The CI pipeline ensures that every code change is verified before it can be merged into the main codebase. This prevents broken code from reaching production.

### GitHub Actions Workflow

The CI workflow is defined in `.github/workflows/ci.yml`. 

**Trigger Events:**
- **Push** to the `main` or `master` branches (e.g., merging a PR).
- **Pull Requests** targeting the `main` or `master` branches.

### Detailed Pipeline Steps

The workflow runs on an `ubuntu-latest` runner and executes the following sequential steps:

| Step | Action Tool / Command | Purpose & Details |
|------|-----------------------|-------------------|
| **1. Checkout** | `actions/checkout@v4` | Clones the repository codebase into the runner environment. |
| **2. Setup Node.js** | `actions/setup-node@v4` | Provisions Node.js **v20**. It also implements npm caching (`cache: 'npm'`) to drastically speed up subsequent workflow runs. |
| **3. Install Dependencies** | `npm ci` | Performs a clean installation of exact dependency versions defined in `package-lock.json`. Faster and more reliable than `npm install` for CI environments. |
| **4. Code Quality (Linting)** | `npm run lint` | Runs **ESLint** (with Next.js config) to catch syntax errors, unused variables, and enforce React hooks rules before tests run. |
| **5. Testing** | `npm test -- --ci --coverage` | Executes the **Jest** test runner. <br/>- `--ci`: Prevents Jest from clearing the console and running in watch mode.<br/>- `--coverage`: Generates a code coverage report.<br/>*Note: Uses a mocked `JWT_SECRET` injected via environment variables for successful test execution.* |
| **6. Production Build** | `npm run build` | Compiles the Next.js application to ensure the codebase can successfully build for production. This catches compilation errors that linting and testing might miss. |

---

## 🚀 Continuous Deployment (CD)

Deployment is fully automated through **Vercel**, which natively supports Next.js applications and provides serverless functions, edge routing, and global CDN distribution out of the box.

### Vercel Environments

Vercel provides two distinct deployment environments automatically synced with GitHub:

1. **Preview Deployments (Staging)**
   - **Trigger**: Opening or updating a Pull Request.
   - **Behavior**: Vercel creates an isolated, ephemeral deployment of the application. 
   - **Purpose**: Allows developers and reviewers to interact with the new features in a live browser environment before merging the code. It generates a unique URL (e.g., `prepmate-pr-12-yourteam.vercel.app`).

2. **Production Deployments**
   - **Trigger**: Pushing or merging code into the `main` (or `master`) branch.
   - **Behavior**: Vercel builds the production-optimized Next.js bundle and publishes it to the main production domain.
   - **Purpose**: Delivers the latest stable application to end users with zero-downtime rollouts.

---

## 🔐 Secrets and Environment Mapping

To pass sensitive information into the build and runtime environments, secrets must be configured in both GitHub and Vercel.

### 1. GitHub Actions Secrets
Required for the database connection and token verification during the `npm run build` step in the CI pipeline.

Configure these in **GitHub Repository → Settings → Secrets and variables → Actions**:

| Secret Name | Purpose in CI |
|-------------|---------------|
| `MONGODB_URI` | Required by Next.js at build time if any pre-rendering fetches database data, and to validate the database connection logic. |
| `JWT_SECRET` | Required for authentication utilities to compile and pass integration tests successfully. |

### 2. Vercel Environment Variables
Required for the actual runtime application to function properly on the web.

Configure these in the **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable Name | Production Value | Preview Value (Staging) |
|---------------|------------------|-------------------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@prod-cluster...` | Optional: Use a separate staging DB cluster or restrict access. |
| `JWT_SECRET` | A highly secure, long, random string. | A secure, long, random string. |

---

## 🛠️ Local Development Parity

To ensure the local development environment closely mirrors the CI/CD pipeline:

1. **Local `.env.local`**: Developers must maintain their own `.env.local` file (ignored by git) containing `MONGODB_URI` and `JWT_SECRET`.
2. **Pre-commit Checks (Recommended)**: Developers are encouraged to manually verify code quality before pushing by running:
   ```bash
   npm run lint && npm test
   ```

---

## 📈 Future Infrastructure Roadmap

As the project scales, the following DevOps enhancements are planned:

1. **End-to-End (E2E) Testing in CI**: Integrating **Playwright** or **Cypress** into the GitHub Actions workflow to automatically test critical user flows (e.g., Auth, Timetable UI) against Vercel Preview URLs.
2. **Database Migrations Scripting**: Implementing automated schema migrations for MongoDB.
3. **Automated Dependency Updates**: Configuring **Dependabot** or **Renovate** to automatically open PRs for vulnerable or outdated npm packages.
