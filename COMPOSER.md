# DEX Creator - Composer Documentation

This document provides a comprehensive guide for AI composers working on this project, focusing on the current structure and technical decisions.

## For AI Composers

**IMPORTANT**: This document should be automatically maintained by AI composers. As the AI composer working on this project, you are responsible for:

1. Updating this document whenever you make changes to the codebase or architecture
2. Keeping the "Known Issues" section current when resolving or discovering issues
3. Maintaining the "Current Tasks and Roadmap" section in sync with project progress
4. Adding new API endpoints to the documentation as they are implemented
5. Updating file paths and code examples when the codebase structure changes
6. Expanding technical explanations based on new implementations

You should proactively update this document without waiting for explicit instructions to do so. The goal is to keep this documentation continuously accurate as the project evolves.

## Project Overview

DEX Creator is a platform that lets users create their own perpetual decentralized exchanges (DEXs) using Orderly Networks infrastructure. The platform simplifies DEX creation and deployment through an intuitive UI and automated processes.

## System Architecture

This is a monorepo managed with Yarn Workspaces:

```
dex-creator/
├── app/            # Remix-based frontend (SPA)
│   ├── app/        # Application source code
│   │   └── styles/ # Source styles (including global.css)
│   └── public/     # Public assets
├── api/            # Node.js API server (Hono)
├── .github/        # GitHub configuration
│   └── workflows/  # GitHub Actions workflows
├── tsconfig.base.json  # Shared TypeScript configuration
└── package.json    # Root package with workspaces
```

### Technology Stack

- **Frontend**: Remix (SPA mode), React 19, TypeScript
- **Backend**: Node.js v22+, Hono, TypeScript
- **Deployment**: GitHub Pages (automated through CI)
- **Package Management**: Yarn Workspaces
- **CI/CD**: GitHub Actions

## Key Components

### Frontend Application (`app/`)

The frontend is a Remix-based Single Page Application (SPA) for DEX creation and management.

Key files:

- `app/vite.config.ts`: Configuration for Vite
- `app/remix.config.js`: Remix configuration with SPA mode enabled
- `app/app/entry.client.tsx`: Client entry point
- `app/app/root.tsx`: Root component
- `app/app/routes/_index.tsx`: Home page component
- `app/app/styles/global.css`: Stylesheets directly imported in components

### Backend API (`api/`)

The backend is a Node.js API server built with Hono for storing user DEX configurations.

Key files:

- `api/src/index.ts`: Main server entry point
- `api/src/routes/dex.ts`: API routes for DEX operations
- `api/src/models/dex.ts`: Data models and storage

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

- `.github/workflows/ci.yml`: Main CI workflow that runs on pushes to main and pull requests
  - Linting with ESLint
  - Format checking with Prettier
  - Type checking with TypeScript
  - Building both the frontend and API

## Coding Standards

1. **TypeScript Usage**:

   - Prefer type inference over manual type definitions
   - Only add explicit type annotations when necessary
   - Use interfaces for object shapes that will be implemented or extended
   - Use type aliases for unions, intersections, and simpler object types

2. **Naming Conventions**:

   - Use camelCase for variables, functions, and methods
   - Use PascalCase for classes, interfaces, types, and React components
   - Use UPPER_CASE for constants

3. **CSS Strategy**:

   - Keep source CSS files in `app/app/styles/`
   - Import CSS files directly in components where needed
   - Leverage Vite's built-in CSS handling for processing and bundling

4. **Code Quality**:
   - All code must pass ESLint rules
   - All code must be properly formatted with Prettier
   - All TypeScript code must type check without errors
   - CI pipeline ensures these standards are maintained

## Known Issues

1. **TypeScript type compatibility issues with Hono zValidator**:
   - zValidator middleware has type compatibility issues with Hono's Context
   - Currently ignoring these TypeScript errors
   - Error: "Argument of type '"json"' is not assignable to parameter of type 'never'"

## Current Tasks and Roadmap

1. **Short-term tasks**:

   - Fix TypeScript type compatibility with zValidator
   - Add documentation for API endpoints (OpenAPI/Swagger)
   - Implement testing for API endpoints
   - Improve error handling with more specific error messages

2. **Medium-term tasks**:

   - Implement proper storage solution instead of in-memory storage
   - Add authentication for API endpoints
   - Create UI components for the DEX customization
   - Implement the forking and deployment workflow

3. **Long-term vision**:
   - Add dashboard for DEX operators to monitor performance
   - Implement templates for different types of DEXes
   - Add white-labeling options

## Configuration Details

### Node.js Requirements

The project requires Node.js v22 or later for improved ES module support, performance, and modern JavaScript features.

### TypeScript Configuration

The project uses a shared base TypeScript configuration (`tsconfig.base.json`) with:

- Target set to ES2023
- Module resolution set to "bundler"
- Strict type-checking enabled

### CI Configuration

The project uses GitHub Actions for continuous integration:

- Runs on pushes to the main branch and on pull requests
- Uses Node.js v22
- Caches Yarn dependencies for faster builds
- Separates code quality checks from build steps

## Development Instructions

To run the project locally:

1. Install dependencies: `yarn install`
2. Start the frontend: `cd app && yarn dev`
3. Start the API server: `cd api && yarn dev`

## API Documentation

### Planned API Endpoints

Note: These API endpoints are currently placeholders and not yet implemented. The actual implementation is pending.

| Method | Endpoint     | Description        | Status  |
| ------ | ------------ | ------------------ | ------- |
| GET    | /api/dex     | List all DEXes     | Planned |
| GET    | /api/dex/:id | Get a specific DEX | Planned |
| POST   | /api/dex     | Create a new DEX   | Planned |
| PUT    | /api/dex/:id | Update a DEX       | Planned |
| DELETE | /api/dex/:id | Delete a DEX       | Planned |

### Sample API Design

The following represents the planned request/response format (subject to change):

#### Create a DEX (POST /api/dex)

Request:

```json
{
  "name": "My Awesome DEX",
  "description": "A custom perpetual DEX powered by Orderly",
  "logo": "https://example.com/logo.png",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981"
  }
}
```

Response (201):

```json
{
  "id": "abc123",
  "name": "My Awesome DEX",
  "description": "A custom perpetual DEX powered by Orderly",
  "logo": "https://example.com/logo.png",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981"
  },
  "createdAt": "2023-04-03T10:30:00.000Z",
  "updatedAt": "2023-04-03T10:30:00.000Z"
}
```

## Technical Decisions

### Technology Choices

- **Hono for API**: Lightweight, fast, TypeScript-friendly API framework with middleware support
- **Remix for Frontend**: Excellent DX, built-in SPA mode, React 19 compatibility
- **Zod for Validation**: Type-safe schema validation with TypeScript integration
- **Yarn Workspaces**: Efficient dependency management for monorepo structure
- **GitHub Actions**: Automated CI/CD pipeline for quality control and deployment

### Development Approach

- **CSS Strategy**: Direct imports in components, utilizing Vite's built-in CSS processing
- **TypeScript Strategy**: Emphasis on type inference over explicit annotations
- **Development Tools**: tsx for running TypeScript, ESLint and Prettier for code quality
- **Quality Assurance**: Automated checks through CI pipeline ensure consistent code quality

---

## Contact Information

For questions or clarifications about this project:

- **Project Maintainer**: Mario Reder <mario@orderly.network>
- **Repository**: git@github.com:OrderlyNetwork/dex-creator.git

## Onboarding Checklist for New AI Composers

When you're first assigned to this project, follow these steps:

1. Review this entire document to understand the project structure and standards
2. Examine the key files mentioned in the [Key Components](#key-components) section
3. Run the project locally following the [Development Instructions](#development-instructions)
4. Review current [Known Issues](#known-issues) and [Current Tasks](#current-tasks-and-roadmap)
5. When making changes, ensure you update this documentation as specified in the [For AI Composers](#for-ai-composers) section

---

_This document will be continuously updated as the project evolves._
