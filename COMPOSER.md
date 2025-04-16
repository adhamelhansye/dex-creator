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

**TERMINAL USAGE**: Do not start any terminal processes or run commands. The project maintainer will handle running the necessary commands and starting development servers.

**DOCUMENTATION GUIDELINES**:

- When a task is completed, remove it entirely from the tasks list
- When a bug or issue is fixed, remove it entirely from the tasks list or known issues
- When adding new components or features, ensure they're properly documented with file paths and descriptions
- Keep the roadmap updated based on current priorities
- Use consistent formatting throughout the document

## Project Overview

DEX Creator is a platform that lets users create their own perpetual decentralized exchanges (DEXs) using Orderly Networks infrastructure. The platform simplifies DEX creation and deployment through an intuitive UI and automated processes.

## Git Hooks and Module Configuration

The project uses Husky for Git hooks to ensure code quality standards are maintained.

### Git Hooks Setup

- **Husky**: Used for managing Git hooks (v9+)
- **Prettier Hook**: Custom implementation in `.husky/prettier-hook.mjs` for running Prettier on staged files
- **Lint Staged**: Configured to run hooks on staged files before commits
- **Commitlint**: Ensures commit messages follow conventional commit format

### Module System Configuration

The project uses a hybrid approach to JavaScript modules:

1. **Package Configuration**: The root `package.json` specifies `"type": "module"` which means:
   - `.js` files are treated as ES Modules by default
   - Import/export syntax is used instead of require/module.exports
   - Node.js native ES Modules features are leveraged

2. **File Extensions**: 
   - Use `.cjs` extension for files that must be CommonJS (like configuration files used by older tools)
   - Use `.mjs` extension for files that must be ES Modules within a CommonJS context
   - Follow the module system specified by the containing package's `"type"` field

## System Architecture

This is a monorepo managed with Yarn Workspaces:

```
dex-creator/
├── app/            # Remix-based frontend (SPA)
│   ├── app/        # Application source code
│   │   ├── components/ # React components
│   │   ├── context/    # React contexts
│   │   ├── utils/      # Utility functions
│   │   └── styles/ # Source styles (including global.css)
│   └── public/     # Public assets
├── api/            # Node.js API server (Hono)
│   ├── src/        # API source code
│   │   ├── models/ # Data models
│   │   └── routes/ # API routes
│   └── prisma/     # Prisma ORM configuration
│       └── schema.prisma  # Database schema
├── .github/        # GitHub configuration
│   └── workflows/  # GitHub Actions workflows
├── tsconfig.base.json  # Shared TypeScript configuration
└── package.json    # Root package with workspaces
```

### Technology Stack

- **Frontend**: Remix (SPA mode), React 19, TypeScript, Wagmi, TanStack React Query
- **Styling**: UnoCSS, a utility-first CSS framework with atomic CSS capabilities
- **Icons**: Iconify with @iconify/react for SVG icons
- **Notifications**: React-Toastify for toast messages
- **Backend**: Node.js v22+, Hono, TypeScript, Ethers.js
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: GitHub Pages (automated through CI)
- **Package Management**: Yarn Workspaces
- **CI/CD**: GitHub Actions
- **Authentication**: EVM Wallet (Ethereum) signature-based authentication

## Admin Functionality

The DEX Creator platform includes a comprehensive admin system that allows privileged users to manage DEX instances across the platform.

### Key Features

1. **Role-Based Access Control**: Users can be assigned admin privileges through a database flag
2. **Admin Dashboard**: A secure interface for performing administrative actions
3. **DEX Management**: Ability to delete DEXes associated with specific wallet addresses
4. **Security**: Multi-layered authentication and authorization checks

### Technical Implementation

#### Database Schema

The admin functionality is built upon a `isAdmin` boolean field in the User model:

```prisma
model User {
  id        String   @id @default(uuid())
  address   String   @unique
  nonce     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isAdmin   Boolean  @default(false)
  // other fields...
}
```

#### Backend Implementation

##### Admin Model (`api/src/models/admin.ts`)

The admin model provides core functions for admin management:

- `isUserAdmin(userId: string)`: Checks if a user has admin privileges
- `getAllAdmins()`: Retrieves all admin users from the database

These functions use raw SQL queries to avoid TypeScript issues with the Prisma schema, providing a pragmatic approach to handling the admin functionality.

##### Admin Routes (`api/src/routes/admin.ts`)

Secure API endpoints for admin operations:

- `GET /api/admin/users`: List all admin users (admin only)
- `GET /api/admin/check`: Check if the current user is an admin

The admin routes implementation uses function declarations with explicit type annotations rather than arrow functions with implicit types. This approach improves code reliability and maintainability.

Note: Admin privileges are set directly in the database, not through API endpoints.

##### Middleware

The admin system implements middleware functions to secure admin routes:

- `checkAdminUser`: Verifies that a user has admin privileges before allowing access to protected endpoints

##### DEX Management Routes

Admin functionality for managing DEXes:

- `DELETE /api/dex/admin/delete`: Allows admins to delete a DEX by wallet address

#### Frontend Implementation

##### Admin Page (`app/app/routes/admin.tsx`)

The admin interface provides:

- Admin status checking on page load
- Proper authorization flow with clear user feedback
- Interface for deleting DEXes by wallet address
- Comprehensive error handling and result display

##### Auth Context Integration

The admin functionality integrates with the existing authentication system:

- Admin status is checked on page load through the Auth context
- The API client handles authentication headers for admin requests

### Security Considerations

1. **Multiple Authorization Layers**:
   - Bearer token authentication
   - Admin role verification
   - Raw SQL queries for admin checks to ensure database-level security

2. **Error Handling**:
   - Consistent error responses
   - Limited error information exposure
   - Comprehensive logging

3. **Access Control**:
   - Strict middleware checks
   - Clear separation between admin and regular user routes

### Type Safety in Server Code

In our server-side code, we prioritize explicit typing and standard patterns:

1. **Function Declarations**: Use standard function declarations with explicit parameter types rather than arrow functions with implicit types
2. **Context Typing**: Use Hono's built-in Context type rather than creating custom context types
3. **Type Assertions**: Minimize use of type assertions and prefer proper type definitions

This approach improves code clarity, helps catch errors during development, and makes the codebase more maintainable.

## Key Components

### Frontend Application (`app/`)

The frontend is a Remix-based Single Page Application (SPA) for DEX creation and management.

Key files:

- `app/vite.config.ts`: Configuration for Vite with Node.js polyfills
- `app/remix.config.js`: Remix configuration with SPA mode enabled
- `app/app/entry.client.tsx`: Client entry point
- `app/app/root.tsx`: Root component with Wagmi and Auth providers
- `app/app/routes/_index.tsx`: Home page component
- `app/app/styles/global.css`: Stylesheets directly imported in components
- `app/app/components/WalletConnect.tsx`: Component for wallet connection and authentication
- `app/app/components/LoginModal.tsx`: Modal explaining the wallet signing process
- `app/app/context/AuthContext.tsx`: Authentication context for wallet auth state management
- `app/app/utils/wagmiConfig.ts`: Configuration for Wagmi web3 provider
- `app/uno.config.ts`: UnoCSS configuration file defining themes, colors, and shortcuts

#### Loading Animations

The application uses SVG Spinners via Iconify and UnoCSS for beautiful and consistent loading animations:

- **Package**: `@iconify-json/svg-spinners` provides high-quality animated SVG loaders
- **Integration**: UnoCSS's `presetIcons` enables direct use in className strings
- **Usage Example**: `i-svg-spinners:pulse-rings-multiple` class renders the spinner

This approach provides a consistent, visually appealing loading experience throughout the application without additional JavaScript or animation libraries.

### Backend API (`api/`)

The backend is a Node.js API server built with Hono for storing user DEX configurations and handling authentication.

Key files:

- `api/src/index.ts`: Main server entry point
- `api/src/routes/dex.ts`: API routes for DEX operations
- `api/src/routes/auth.ts`: API routes for wallet authentication
- `api/src/routes/admin.ts`: API routes for admin operations
- `api/src/models/dex.ts`: Data models and storage for DEXes
- `api/src/models/user.ts`: User model for authentication
- `api/src/models/admin.ts`: Admin model for admin management
- `api/src/lib/prisma.ts`: Prisma client configuration
- `api/prisma/schema.prisma`: Database schema definition

### Database Architecture

The application uses PostgreSQL as the database with Prisma ORM for database operations:

1. **Schema Definition**: Located at `api/prisma/schema.prisma`
2. **Models**:
   - `User`: Stores user information and authentication details
   - `Token`: Manages authentication tokens with expiration
3. **Database Connection**: Managed through the Prisma client in `api/src/lib/prisma.ts`
4. **Migrations**: Automatically generated in `api/prisma/migrations/` folder

The database is configured with proper indexes and relations to ensure efficient queries and data integrity:
- The `User` model has an index on the `address` field for quick lookups
- The `Token` model has indexes on both `token` and `userId` fields
- Cascading deletes ensure that when a user is deleted, their tokens are automatically removed

### Authentication Flow

The platform uses EVM wallet authentication with token validation:

1. User connects their wallet (e.g., MetaMask) using Wagmi
2. A login explainer modal appears automatically to guide users through signing
3. Backend generates a random nonce for the user's address
4. User signs a message containing the nonce
5. Backend verifies the signature using ethers.js
6. Upon verification, a token is issued with a 24-hour expiration and the user is authenticated
7. On page refresh or application restart, the token is validated with the server
8. Expired or invalid tokens trigger automatic logout with notification
9. Background validation occurs every 15 minutes to ensure token freshness
10. Toast notifications provide feedback throughout the process

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

3. **Node.js Imports**:

   - Always use the `node:` prefix for built-in Node.js modules (e.g., `import fs from "node:fs"`)
   - This ensures you're using the Node.js implementation rather than potentially conflicting with NPM packages
   - Example: Use `import path from "node:path"` instead of `import path from "path"`

4. **CSS Strategy**:

   - **IMPORTANT**: Always prefer UnoCSS utility classes over manual CSS
   - UnoCSS configuration in `app/uno.config.ts` defines shortcuts, themes, and colors
   - For complex components, use composition of UnoCSS utility classes instead of writing custom CSS
   - Only use global.css for base styles and overrides that cannot be achieved with UnoCSS
   - When using icons, prefer Iconify with the @iconify/react package

5. **UI Components**:

   - Use pill-shaped designs for interactive elements (rounded-full)
   - Maintain consistent padding and font sizes across similar components
   - Use subtle background colors with transparency (background-light/30)
   - Prefer subtle borders to define component boundaries
   - Follow the Orderly color palette defined in UnoCSS config

6. **Responsive Design**:

   - Use mobile-first approach with responsive utility classes (e.g., `md:px-4`)
   - Reduce paddings, margins, and font sizes on mobile screens
   - Hide non-essential UI elements on small screens using `hidden md:block`
   - Scale down icon sizes and interactive elements for better mobile ergonomics
   - Test all UI components on multiple device sizes during development

7. **Error Handling**:

   - Use toast notifications for error feedback instead of inline error messages
   - Log errors to console for debugging
   - Provide clear user feedback for all interactions

8. **Code Quality**:

   - All code must pass ESLint rules
   - All code must be properly formatted with Prettier
   - All TypeScript code must type check without errors
   - CI pipeline ensures these standards are maintained

9. **Authentication and Security**:

   - Always validate tokens on application load
   - Include token expiration checks
   - Handle expired tokens gracefully with user feedback
   - Do not store sensitive information in localStorage
   - Implement periodic token validation for long-lived sessions

10. **Database Operations**:
   - Use Prisma's type-safe operations for all database interactions
   - Keep transactions atomic when performing related operations
   - Include proper error handling for database operations
   - Use async/await for all database operations (Prisma methods return Promises)
   - Implement periodic cleanup for expired tokens

## UI Design System

The DEX Creator follows a consistent design system with utility-first CSS using UnoCSS.

### Core Style Principles

- **Mobile-first approach** with responsive breakpoints (sm, md, lg, xl)
- **Dark theme** with vibrant accents for interactive elements
- **Card-based layout** with consistent padding and rounded corners
- **Pill-shaped buttons** with gradient backgrounds and subtle hover effects
- **Utility-first implementation** directly in component JSX using UnoCSS

### Color System

#### Primary Colors

```css
primary: {
  DEFAULT: "rgb(89, 91, 255)",  /* Main action color */
  light: "rgb(125, 125, 255)",  /* Hover and accent color */
},
secondary: {
  DEFAULT: "rgb(157, 78, 221)", /* Secondary actions */
  light: "rgb(187, 118, 242)",  /* Secondary hover state */
}
```

#### Status Colors

```css
success: "rgb(48, 208, 88)",    /* Green for success states */
warning: "rgb(242, 153, 74)",   /* Amber for warnings */
error: "rgb(242, 78, 78)",      /* Red for errors */
```

These colors should be used instead of direct color utilities:
- Use `text-success` instead of `text-green-*`
- Use `bg-success/10` instead of `bg-green-*/10`
- Use `text-error` instead of `text-red-*`

### Animation System

Subtle animations provide feedback and improve perceived performance:

```css
.slide-fade-in {
  animation: slideFadeIn 0.3s ease forwards;
  transform-origin: top center;
}

.slide-fade-in-delayed {
  animation: slideFadeIn 0.3s ease 0.1s forwards;
  opacity: 0;
}

.staggered-item:nth-child(1) { animation: slideFadeIn 0.25s ease 0.05s forwards; }
.staggered-item:nth-child(2) { animation: slideFadeIn 0.25s ease 0.1s forwards; }
```

#### Sequential List Animations

For lists with staggered animations:

```jsx
<div className="list">
  {items.map(item => (
    <div key={item.id} className="staggered-item">
      {item.name}
    </div>
  ))}
</div>
```

#### Dynamic Animations

For custom animation timing:

```jsx
<div>
  {items.map((item, index) => (
    <div
      key={item.id}
      style={{
        animation: `slideFadeIn 0.25s ease ${0.1 + index * 0.05}s forwards`,
        opacity: 0,
        transform: "translateY(-10px)"
      }}
    >
      {item.content}
    </div>
  ))}
</div>
```

#### Animation Best Practices

- Use animations sparingly for user feedback and transitions
- Apply primarily to elements that appear/update based on user actions
- Keep animations short (0.2-0.3s) and subtle
- Prefer class-based animations over inline styles

### Component Features

#### Button Variants

Button styles use consistent shortcuts defined in UnoCSS config:

```jsx
<Button variant="primary">Connect Wallet</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
```

#### Image Pasting

The DEX Creator provides a dedicated image paste system allowing users to customize branding:

- **Multiple methods for user convenience**:
  - Dedicated "Paste Image" button that requests clipboard access
  - Traditional paste area supporting keyboard shortcuts (Ctrl+V / ⌘+V)
  - Visual focus states to indicate which paste area is active

- **Advanced crop and resize functionality**:
  - Interactive crop preview with visual overlay
  - Pixel-perfect control via numeric inputs
  - Primary logo supports free-form aspect ratios
  - Secondary logo and favicon maintain square aspect ratios automatically
  - Automatic centering of initial crop area
  - Real-time preview of final output dimensions

- **Technical implementation**:
  - Client-side processing with JSQuash library for WebP conversion and resizing
  - Default sizes: 
    - Primary Logo: 200x42px (horizontal logo for headers)
    - Secondary Logo: 40x40px (square icon for UI elements)
    - Favicon: 32x32px (browser tab icon)
  - Canvas-based cropping with controlled dimensions
  - Clipboard API with fallback to ClipboardEvent for cross-browser compatibility
  - Logo files stored as WebP images in the repository:
    - Primary logo: `public/logo.webp`
    - Secondary logo: `public/logo-secondary.webp`
    - Favicon: `public/favicon.webp`
  - Environment flags (VITE_HAS_PRIMARY_LOGO, VITE_HAS_SECONDARY_LOGO) indicate if logos have been set
  - No more base64 encoding in environment variables for better repository size management
  
- **User feedback**:
  - Loading indicator during image processing
  - Preview of pasted image with option to replace
  - Toast notifications for success/error states
  - Clear visual affordances for all interactions

Example usage:
```tsx
<ImagePaste
  id="primaryLogo"
  label="Primary Logo"
  value={primaryLogo}
  onChange={handleLogoChange}
  imageType="primaryLogo"
  helpText="This will appear in the header"
/>
```

#### Responsive Design

The application uses these responsive breakpoints with UnoCSS:

- `sm`: 640px (small tablets and large phones)
- `md`: 768px (tablets and small laptops)
- `lg`: 1024px (laptops and desktops)
- `xl`: 1280px (large desktops)
- `2xl`: 1536px (extra large screens)

Default (no prefix) styles apply to mobile first, with larger screen adjustments using prefixes:

```jsx
<div className="text-xs md:text-sm lg:text-base">
  Responsive text that scales with screen size
</div>
```

### Icon System

The project uses Iconify for SVG icons:

- `@iconify/react` package provides React components
- Icons are loaded dynamically from various icon sets
- UnoCSS integration allows for utility-class based icons
- Usage patterns:
  ```jsx
  {/* Component approach */}
  <Icon icon="heroicons:check-circle" width={16} />
  
  {/* UnoCSS utility approach */}
  <div className="i-mdi:check-circle text-success w-5 h-5"></div>
  ```

## Known Issues

Currently, there are no known issues in the project.

## Repository Forking

The DEX Creator implements GitHub repository forking to create customized DEX repositories for users. This process is integrated with the DEX creation flow.

### Implementation Details

1. **Immediate Forking**:
   - When a user creates a new DEX, the system automatically attempts to fork the template repository
   - Repository names use a simplified dash-case version of the broker name with a minimal suffix for uniqueness
   - The naming approach prioritizes shorter URLs for GitHub Pages deployment (e.g., `broker-name-1234`)
   - Repository forking happens in parallel with DEX database entry creation

2. **Error Handling**:
   - If repository forking fails, the DEX is still created in the database without a repository URL
   - Users can retry the forking process from the UI using a dedicated "Retry Repository Creation" button
   - Detailed error information is logged for debugging purposes

3. **Repository Creation Process**:
   - The system creates a new empty repository under the authenticated GitHub user
   - Contents from the template repository are copied recursively to the new repository
   - Directories and files are processed with proper error handling for individual files
   - User-specific configuration (like broker name) is applied to the repository

4. **Logo and Branding Assets**:
   - Logo files are stored as webp image files in the public folder:
     - Primary logo: `public/logo.webp` (horizontal logo for headers)
     - Secondary logo: `public/logo-secondary.webp` (square icon for UI elements)
     - Favicon: `public/favicon.webp` (browser tab icon)
   - Environment variables indicate if logos have been set:
     - `VITE_HAS_PRIMARY_LOGO=true` when primary logo has been set
     - `VITE_HAS_SECONDARY_LOGO=true` when secondary logo has been set
   - This allows the frontend to use fallback logos when custom logos aren't available
   - Binary image data is handled efficiently without base64 encoding in environment variables

5. **GitHub Pages Deployment**:
   - A GitHub Pages deployment token is automatically added as a secret to each forked repository
   - This token (`PAGES_DEPLOYMENT_TOKEN`) enables GitHub Actions to deploy the DEX to GitHub Pages
   - The token is securely encrypted using libsodium before being added as a repository secret
   - If the token is not found in environment variables, a warning is logged but the fork process continues
   - GitHub Actions are automatically enabled on forked repositories (addressing GitHub's default security policy)
   - The system makes appropriate API calls to enable workflows despite GitHub's default restriction on forked repos

6. **Security Considerations**:
   - GitHub API tokens are stored securely and never exposed to clients
   - Only necessary repository permissions are requested
   - Rate limiting and error handling prevent abuse

This approach provides a reliable way to create user-specific DEX instances while maintaining a graceful degradation path when GitHub API issues occur.

### Repository Updates

We use a single-commit approach for all GitHub repository updates:

- **What**: All repository changes (config files, workflows, themes, logos) are batched into a single Git commit
- **Why**: 
  - Reduces GitHub API rate limit usage
  - Creates cleaner commit history
  - Prevents multiple CI/CD workflow triggers
  - Ensures atomic updates (all changes succeed or fail together)
  - Simplifies rollback scenarios

This approach replaces the previous implementation that created individual commits for each file change, resulting in more efficient repository management and better reliability.

## Configuration Details

### Node.js Requirements

The project requires Node.js v22 or later for improved ES module support, performance, and modern JavaScript features.

### Database Configuration

The project uses PostgreSQL with Prisma ORM:

1. **Setup with Docker**:

   ```bash
   # Start a PostgreSQL container
   docker run --name dex-creator-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_DB=dex_creator \
     -p 5432:5432 \
     -d postgres:16
   ```

2. **Connection String**:
   The database connection string is configured in the `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dex_creator?schema=public"
   ```

3. **Prisma Commands**:
   - `yarn db:migrate:dev`: Create and apply development migrations
   - `yarn db:migrate:deploy`: Apply migrations in production
   - `yarn db:generate`: Generate Prisma client after schema changes
   - `yarn db:studio`: Open Prisma Studio to browse and edit data
   - `yarn db:push`: Push schema changes directly to the database (dev only)

4. **Schema Location**:
   The Prisma schema is defined in `api/prisma/schema.prisma`

## Docker Deployment

The API can be deployed using Docker with a simple approach:

### Key Components

- **`Dockerfile`**: Multi-stage build that handles TypeScript compilation with tsup and Prisma generation
- **`docker-entrypoint.sh`**: Handles database migrations and application startup
- **Environment Variables**: 
  - `MIGRATE_DB=true`: Enables automatic database migrations on startup
  - `DATABASE_URL`: PostgreSQL connection string
  - `GITHUB_TOKEN`: For repository forking
  - `PAGES_DEPLOYMENT_TOKEN`: For GitHub Pages deployments

### Quick Deployment

```bash
# Build the image
docker build -t dex-creator-api .

# Run the container with host networking (recommended on Linux)
docker run -d \
  --name dex-creator-api \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dex_creator?schema=public \
  -e GITHUB_TOKEN=your-github-token \
  -e MIGRATE_DB=true \
  dex-creator-api
```

### TypeScript Configuration

The project uses a shared base TypeScript configuration (`tsconfig.base.json`) with:

- Target set to ES2023
- Module resolution set to "bundler"
- Strict type-checking enabled

### UnoCSS Configuration

The project uses UnoCSS for styling with a configuration file at `app/uno.config.ts`:

- Custom color palette aligned with the Orderly design system
- Presets including UnoCSS default and web fonts
- Custom shortcuts for common UI patterns (buttons, cards, etc.)
- Responsive design utilities

### Styling Approach and Priorities

The DEX Creator application follows a utility-first CSS approach with clear priorities for styling implementation:

1. **UnoCSS Utility Classes (First Priority)**:
   - Use utility classes directly in component JSX whenever possible
   - Leverage UnoCSS shortcuts for common patterns (defined in `app/uno.config.ts`)
   - Compose complex styles directly in the markup rather than creating custom CSS
   - Example: `<div className="flex flex-col gap-2 mt-4 text-sm text-gray-300 rounded-lg p-4 bg-background-card"></div>`

2. **Component-Specific Styling with clsx (Second Priority)**:
   - Use the `clsx` library to conditionally apply classes
   - Build variant styles as objects in component files
   - Example from Button component:
     ```tsx
     const variantClasses = {
       primary: 'btn-connect',
       secondary: 'btn-secondary',
       danger: 'bg-red-500 text-white hover:bg-red-600',
     };
     ```

3. **Global Styles (Use Sparingly)**:
   - Global styles should be limited to:
     - Reset styles (already provided by UnoCSS)
     - Base HTML element styles
     - CSS variables (colors, transitions, etc.)
     - Third-party library overrides (like Toastify)
   - Located in `app/app/styles/global.css`
   - Should never override or duplicate utility classes

4. **When to Use Global Styles**:
   - Styling third-party components that can't be styled with classes (React-Toastify, Reown AppKit)
   - Defining CSS variables for theme consistency
   - Applying base styles to HTML elements
   - Custom animations or complex CSS that can't be expressed with utility classes

5. **Examples**:
   - **Preferred (UnoCSS)**: `<button className="btn btn-connect glow-effect">Button</button>`
   - **Acceptable (clsx)**: 
     ```tsx
     <button className={clsx(
       'btn',
       variantClasses[variant],
       glowClass
     )}>Button</button>
     ```
   - **Only When Necessary (global CSS)**: 
     ```css
     /* In global.css - for third-party components */
     .Toastify__toast--error {
       border-left: 4px solid #ff5252 !important;
     }
     ```

By prioritizing utility classes, we achieve consistent styling, reduce CSS bloat, and make component styling self-contained and explicit.

### Responsive Breakpoints

The application uses the following responsive breakpoints with UnoCSS:

- `sm`: 640px (small tablets and large phones)
- `md`: 768px (tablets and small laptops)
- `lg`: 1024px (laptops and desktops)
- `xl`: 1280px (large desktops)
- `2xl`: 1536px (extra large screens)

Default (no prefix) styles apply to mobile first, with larger screen adjustments using prefixes.

### Icons

The project uses Iconify for SVG icons:

- @iconify/react package provides React components for icons
- Icons can be loaded dynamically from various icon sets
- Heroicons is the primary icon set used for UI elements
- Usage pattern: `<Icon icon="heroicons:icon-name" width={14} className="md:w-4" />`

### CI Configuration

The project uses GitHub Actions for continuous integration:

- Runs on pushes to the main branch and on pull requests
- Uses Node.js v22
- Caches Yarn dependencies for faster builds
- Separates code quality checks from build steps

## Development Instructions

To run the project locally:

1. Install dependencies: `yarn install`
2. Set up PostgreSQL using Docker (see Database Configuration section)
3. Initialize the database:
   ```bash
   cd api
   yarn db:generate
   yarn db:migrate:dev --name initial_migration
   ```
4. Start both frontend and backend with auto-reloading: `yarn dev`
   - This uses concurrently to run both servers in parallel
   - The frontend runs on http://localhost:3000 with hot module replacement
   - The backend runs on http://localhost:3001 with auto-reloading

Alternative individual commands:

- Start only the frontend: `yarn dev:app`
- Start only the backend: `yarn dev:api`
- Build the frontend: `yarn build:app`
- Build the backend: `yarn build:api`

## API Documentation

### Implemented API Endpoints

| Method | Endpoint           | Description                       | Status      |
| ------ | ------------------ | --------------------------------- | ----------- |
| GET    | /api/dex           | List all DEXes                    | Planned     |
| GET    | /api/dex/:id       | Get a specific DEX                | Planned     |
| POST   | /api/dex           | Create a new DEX                  | Planned     |
| PUT    | /api/dex/:id       | Update a DEX                      | Planned     |
| DELETE | /api/dex/:id       | Delete a DEX                      | Planned     |
| POST   | /api/auth/nonce    | Get a nonce for authentication    | Implemented |
| POST   | /api/auth/verify   | Verify signature and authenticate | Implemented |
| POST   | /api/auth/validate | Validate authentication token     | Implemented |
| POST   | /api/auth/cleanup-tokens | Clean up expired tokens     | Implemented |

### Authentication API Endpoints

#### Request a Nonce (POST /api/auth/nonce)

Request:

```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

Response (200):

```json
{
  "message": "Sign this message to authenticate with DEX Creator: 123456",
  "nonce": "123456"
}
```

#### Verify Signature (POST /api/auth/verify)

Request:

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "signature": "0xabcdef123456789...signature-data"
}
```

Response (200):

```json
{
  "user": {
    "id": "user-uuid",
    "address": "0x1234567890123456789012345678901234567890"
  },
  "token": "auth-token"
}
```

#### Validate Token (POST /api/auth/validate)

Request:

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "token": "auth-token"
}
```

Response (200):

```json
{
  "valid": true,
  "user": {
    "id": "user-uuid",
    "address": "0x1234567890123456789012345678901234567890"
  }
}
```

Error Response (401):

```json
{
  "valid": false,
  "error": "Token invalid or expired"
}
```

#### Clean Up Expired Tokens (POST /api/auth/cleanup-tokens)

Response (200):

```json
{
  "success": true,
  "message": "Cleaned up 5 expired tokens"
}
```

## Technical Decisions

### Technology Choices

- **Hono for API**: Lightweight, fast, TypeScript-friendly API framework with middleware support
- **Remix for Frontend**: Excellent DX, built-in SPA mode, React 19 compatibility
- **UnoCSS**: Atomic CSS framework for efficient, maintainable styling with excellent performance
- **Iconify**: Comprehensive icon solution with thousands of icons and no bundle size impact
- **React-Toastify**: Flexible, customizable toast notification system
- **Zod for Validation**: Type-safe schema validation with TypeScript integration
- **Prisma ORM**: Type-safe database access with excellent TypeScript integration and auto-generated client
- **PostgreSQL**: Robust, reliable relational database with excellent JSON support
- **Yarn Workspaces**: Efficient dependency management for monorepo structure
- **GitHub Actions**: Automated CI/CD pipeline for quality control and deployment
- **Wagmi**: Modern React hooks library for Ethereum
- **ethers.js**: Complete Ethereum library for signature verification
- **vite-plugin-node-polyfills**: Provides Node.js polyfills for web3 libraries in the browser
- **Concurrently**: Tool for running multiple commands simultaneously with organized output
- **TSX**: TypeScript execution and watch mode for Node.js applications
- **libsodium-wrappers**: Used for encrypting GitHub secrets during repository forking

### Development Approach

- **CSS Strategy**: UnoCSS utility classes for styling, with direct composition in JSX
- **Mobile-First Approach**: Base styles for mobile with responsive modifiers for larger screens
- **TypeScript Strategy**: Emphasis on type inference over explicit annotations
- **Database Strategy**: Type-safe operations with Prisma, organized schema with proper indexing
- **Development Tools**: tsx for running TypeScript, ESLint and Prettier for code quality
- **Quality Assurance**: Automated checks through CI pipeline ensure consistent code quality
- **Authentication**: EVM wallet-based authentication with message signing for security
- **Error Handling**: Toast notifications for user feedback, console logging for debugging
- **Auto-Reloading**: Concurrent dev environment with automatic reloading for seamless development
  - Frontend uses Vite's hot module replacement for instantaneous updates without page refresh
  - Backend uses tsx watch mode to automatically restart the server on file changes
  - Concurrently package runs both servers with organized, color-coded output

## Animation System

We've implemented CSS-based animations similar to Svelte's "slide" transitions to provide smooth UI feedback when elements appear or change in the interface.

### Available Animation Classes

The following animation classes are available in `app/styles/global.css`:

```css
.slide-fade-in {
  animation: slideFadeIn 0.3s ease forwards;
  transform-origin: top center;
}

.slide-fade-in-delayed {
  animation: slideFadeIn 0.3s ease 0.1s forwards;
  opacity: 0;
  transform: translateY(-10px);
  transform-origin: top center;
}

.item-slide-in {
  animation: slideFadeIn 0.25s ease forwards;
  transform-origin: top center;
}

@keyframes slideFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered animation for lists */
.staggered-item {
  opacity: 0;
  transform: translateY(-10px);
}

.staggered-item:nth-child(1) { animation: slideFadeIn 0.25s ease 0.05s forwards; }
.staggered-item:nth-child(2) { animation: slideFadeIn 0.25s ease 0.1s forwards; }
.staggered-item:nth-child(3) { animation: slideFadeIn 0.25s ease 0.15s forwards; }
.staggered-item:nth-child(4) { animation: slideFadeIn 0.25s ease 0.2s forwards; }
.staggered-item:nth-child(5) { animation: slideFadeIn 0.25s ease 0.25s forwards; }
```

### How to Use Animations

#### Basic Slide-In Animation

Apply the `slide-fade-in` class to elements that should animate when they first appear:

```jsx
<Card className="slide-fade-in">
  <h3>Content that slides in</h3>
</Card>
```

#### Delayed Animation

Use `slide-fade-in-delayed` for elements that should animate slightly after their parent elements:

```jsx
<div className="slide-fade-in">
  <h3>This appears first</h3>
  <p className="slide-fade-in-delayed">This appears with a slight delay</p>
</div>
```

#### Staggered List Animations

For lists where each item should appear one after another:

```jsx
<div className="list">
  {items.map(item => (
    <div key={item.id} className="staggered-item">
      {item.name}
    </div>
  ))}
</div>
```

#### Dynamic Animation Delays

For more control, you can use inline styles to set custom animation delays:

```jsx
<div>
  {items.map((item, index) => (
    <div
      key={item.id}
      style={{
        animation: `slideFadeIn 0.25s ease ${0.1 + index * 0.05}s forwards`,
        opacity: 0,
        transform: "translateY(-10px)"
      }}
    >
      {item.content}
    </div>
  ))}
</div>
```

### Current Usage

These animations are currently implemented in:

1. The WorkflowStatus component:
   - Main card uses `slide-fade-in`
   - Workflow runs use `staggered-item` for sequential animation
   - Run details use `slide-fade-in` when selected
   - Job details use `slide-fade-in-delayed` and dynamic delays

2. The DEX deployment URL section:
   - Uses `slide-fade-in` when it appears after successful deployment

### Best Practices

1. Use animations sparingly to avoid overwhelming the user
2. Apply animations primarily to elements that:
   - Appear as a result of user action
   - Represent new or updated information
   - Need to draw user attention
3. Prefer class-based animations for consistency
4. Use inline style animations only for complex/dynamic scenarios
5. Keep animations short (0.2-0.3s) and subtle

---

## Contact Information

For questions or clarifications about this project:

- **Project Maintainer**: Mario Reder <mario@orderly.network>
- **Repository**: git@github.com:OrderlyNetworkDexCreator/dex-creator.git

## Onboarding Checklist for New AI Composers

When you're first assigned to this project, follow these steps:

1. Review this entire document to understand the project structure and standards
2. Examine the key files mentioned in the [Key Components](#key-components) section
3. Run the project locally following the [Development Instructions](#development-instructions)
4. Review current [Known Issues](#known-issues)
5. When making changes, ensure you update this documentation as specified in the [For AI Composers](#for-ai-composers) section

---

_This document will be continuously updated as the project evolves._