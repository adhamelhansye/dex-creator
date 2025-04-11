# DEX Creator

A platform that lets you create your own perpetual decentralized exchange (DEX) easily using Orderly Networks infrastructure.

## Project Overview

DEX Creator is a tool that simplifies the process of launching your own perpetual DEX. The platform handles the complexity of DEX creation and deployment by leveraging Orderly Networks' infrastructure.

## Project Structure

This is a monorepo managed with Yarn Workspaces:

- `app/`: Frontend application built with Remix
- `api/`: Backend API server built with Node.js that stores user DEX information

## How It Works

1. Users configure their DEX parameters through our intuitive UI
2. The API server stores the configuration and user information
3. The system forks a base repository and customizes it based on user preferences
4. GitHub Actions are automatically enabled on the forked repository
5. A deployment token is securely added as a repository secret
6. CI/CD automatically deploys the DEX to GitHub Pages without any user intervention

## Features

### User Features

- Create and customize a DEX with your own branding
- Configure social media links and appearance
- Deploy your DEX through an automated process

### Admin Features

- Role-based access control for platform administrators
- Manage DEX instances across the platform
- Delete DEXes by wallet address
- View admin-only information

For detailed documentation on the admin implementation, see [composer.md](./composer.md).

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- Yarn (v1.22 or later)
- Docker and Docker Compose (for PostgreSQL database)

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:OrderlyNetworkDexCreator/dex-creator.git
cd dex-creator
yarn install
```

### Database Setup

The application uses PostgreSQL for data storage. You can run it using Docker:

```bash
# Start a PostgreSQL container
docker run --name dex-creator-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=dex_creator \
  -p 5432:5432 \
  -d postgres:16
```

**Note on Docker Networking**: If you encounter network-related Docker errors, use host networking mode:

```bash
# Alternative setup with host networking
docker run --name dex-creator-postgres \
  --network host \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=dex_creator \
  -d postgres:16
```

Once PostgreSQL is running, initialize the database schema:

```bash
# Generate Prisma client
cd api && yarn db:generate

# Create initial database migration and apply it
yarn db:migrate:dev --name initial_migration
```

### Development

To start both the frontend and backend development servers simultaneously with auto-reloading:

```bash
# Start both frontend and backend with a single command
yarn dev
```

This will launch:

- The frontend Remix app on http://localhost:3000 (with Vite hot module replacement)
- The backend API on http://localhost:3001 (with tsx watch for auto-reloading)

Both servers are configured to auto-reload when changes are detected in their respective source files.

If you prefer to run them separately:

```bash
# For the frontend app
yarn dev:app

# For the backend API
yarn dev:api
```

### Building

The project uses high-performance build tools:

- **Frontend**: Built with Vite for fast bundling
- **API**: Built with tsup for ultra-fast TypeScript compilation (30-50x faster than tsc)

To build both packages:

```bash
# Build everything
yarn build:app && yarn build:api

# Build just the API
cd api && yarn build
```

### Database Management

The project includes several commands for managing the database:

```bash
# Open Prisma Studio to view and edit the database
yarn db:studio

# Apply all pending migrations (for production environments)
yarn db:migrate:deploy

# Generate the Prisma client after schema changes
yarn db:generate

# Push schema changes directly to the database (for development only)
yarn db:push
```

## Deployment

### Frontend Deployment

The frontend is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the main branch. The workflow:

1. Builds the Remix app in SPA mode
2. Deploys the build to the `orderlynetworkdexcreator.github.io` repository 
3. Sets up the custom domain `dex.orderly.network` via a CNAME file

To enable this deployment, you'll need:
- A GitHub Personal Access Token with repo permissions added as a repository secret named `GH_PAGES_DEPLOY_TOKEN`
- A CNAME DNS record pointing `dex.orderly.network` to `orderlynetworkdexcreator.github.io`

### API Deployment with Docker

The backend API can be deployed using Docker:

```bash
# Build the API Docker image (use host networking to avoid bridge driver issues)
docker build -t dex-creator-api --network host .

# Run the API container with host networking
docker run -d \
  --name dex-creator-api \
  --network host \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dex_creator?schema=public \
  -e GITHUB_TOKEN=your-github-token \
  -e GITHUB_TEMPLATE_REPO=OrderlyNetworkDexCreator/dex-creator-template \
  -e PAGES_DEPLOYMENT_TOKEN=your-pages-token \
  -e MIGRATE_DB=true \
  dex-creator-api
```

#### Automatic Database Migrations

The API container includes automatic database migration capabilities:

- Set `MIGRATE_DB=true` to run Prisma migrations on container startup
- Set `MIGRATE_DB=false` (default) to skip migrations

This is useful for fresh deployments or when applying schema changes. For production environments, you may want to run migrations manually or separately to have more control over the process.

## License

MIT
