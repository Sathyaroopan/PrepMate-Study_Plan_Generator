## SE_Project
Software Engineering Project - Group 2

## Topic Chosen:
# L1 — Intelligent Academic Planner and Learning Activity Optimization Platform:
This project focuses on developing an intelligent academic planning and productivity support
platform designed to help students manage coursework, deadlines, examinations, and extracurricular commitments more effectively. Unlike simple scheduling or reminder applications, this
system should integrate AI-based workload analysis, recommendation models that propose optimal study sessions, and behaviour analytics that help students recognize patterns such as
procrastination or burnout. The platform may generate personalized learning plans based on
academic intensity, time availability, and historical performance while preserving student autonomy and privacy. Ethical considerations such as transparency of recommendations, avoidance
of manipulative nudging, and fair treatment of different learning styles should be central to the
design. The system should demonstrate thoughtful UX design and accessibility to support a
diverse student population.

## Testing

### Testing Strategy

This project uses **Jest** as the test runner and **React Testing Library (RTL)** for component testing. The testing strategy covers three layers of the application:

| Layer | Tool | Purpose |
|-------|------|---------|
| **Unit Tests** | Jest | Test pure utility/helper functions in isolation |
| **Integration Tests** | Jest | Test modules that interact (e.g., JWT sign → verify) |
| **Component Tests** | Jest + React Testing Library | Test React components as users interact with them |

### Running Tests

```bash
npm test
```

### Test Structure

All tests are located in the `__tests__/` directory, mirroring the `src/` folder structure:

```
__tests__/
├── lib/
│   ├── scheduler.test.js     # Scheduler helper function tests
│   └── jwt.test.js           # JWT utility tests
└── components/
    └── Navbar.test.jsx       # Navbar component tests
```

### Test Summary

#### 1. Scheduler Helper Tests (`__tests__/lib/scheduler.test.js`)

Tests for the pure helper functions used by the study plan generation algorithm.

| Function | Test Case | Description |
|----------|-----------|-------------|
| `calculatePriority` | High priority | Returns `3` for `'high'` |
| `calculatePriority` | Medium priority | Returns `2` for `'medium'` |
| `calculatePriority` | Low priority | Returns `1` for `'low'` |
| `calculatePriority` | Unknown priority | Returns `1` for any unrecognized value |
| `parseTime` | Standard time | Parses `"09:30"` → Date with hours=9, minutes=30 |
| `parseTime` | Midnight | Parses `"00:00"` correctly |
| `parseTime` | Late evening | Parses `"22:00"` as 10 PM |
| `parseTime` | Immutability | Does not mutate the original base date |
| `calculateFreeIntervals` | No busy blocks | Returns full day as a single free interval |
| `calculateFreeIntervals` | Single busy block | Returns correct gaps before and after the block |
| `calculateFreeIntervals` | Short intervals | Filters out intervals shorter than 30 minutes |
| `calculateFreeIntervals` | Multiple blocks | Handles 3+ busy blocks and returns all free gaps |
| `calculateFreeIntervals` | Block at day start | Handles busy block starting at 6:00 AM |

#### 2. JWT Utility Tests (`__tests__/lib/jwt.test.js`)

Tests for the authentication token utilities (`signToken` and `verifyToken`).

| Function | Test Case | Description |
|----------|-----------|-------------|
| `signToken` | Returns string | Produces a non-empty string token |
| `signToken` | JWT format | Token has 3 dot-separated parts (header.payload.signature) |
| `verifyToken` | Valid token | Decodes and returns the original payload (id, name, rollNumber) |
| `verifyToken` | Claims present | Decoded token includes `iat` and `exp` claims |
| `verifyToken` | Tampered token | Throws error for a modified token string |
| `verifyToken` | Invalid token | Throws error for a completely invalid token |

#### 3. Navbar Component Tests (`__tests__/components/Navbar.test.jsx`)

Tests for the Navbar React component using React Testing Library.

| Test Case | Description |
|-----------|-------------|
| Renders user name | Verifies the `userName` prop is displayed |
| Renders logos | Confirms both light and dark mode logo images render |
| Theme toggle button | Checks the theme toggle and user name buttons exist |
| Theme toggle click | Verifies `data-theme` attribute changes from `"light"` to `"dark"` on click |
| LocalStorage persistence | Confirms theme preference is saved to `localStorage` on toggle |

### Testing Tools & Configuration

| File | Purpose |
|------|---------|
| `jest.config.mjs` | Jest configuration using `next/jest` for Next.js-aware transforms, path aliases, and test environment setup |
| `jest.setup.js` | Global setup that loads `@testing-library/jest-dom` custom matchers (e.g., `toBeInTheDocument()`) |

### Test Results

```
Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
```
