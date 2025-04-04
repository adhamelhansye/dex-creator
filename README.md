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
4. CI/CD automatically deploys the DEX to GitHub Pages

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- Yarn (v1.22 or later)
- Docker and Docker Compose (for PostgreSQL database)

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:OrderlyNetwork/dex-creator.git
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

The project automatically deploys to GitHub Pages through the CI pipeline when changes are pushed to the main branch.

## License

MIT
