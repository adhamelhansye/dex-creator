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
- Create custom navigation menus with structured name and URL inputs
- Deploy your DEX through an automated process
- Upgrade your DEX through a graduation process to earn fee splits and enable rewards

### Admin Features

- Role-based access control for platform administrators
- Manage DEX instances across the platform
- Delete DEXes by wallet address
- Approve broker ID requests for graduated DEXes
- View admin-only information

For detailed documentation on the admin implementation, see [COMPOSER.md](./COMPOSER.md).

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- Yarn (v1.22 or later)
- Docker and Docker Compose (for PostgreSQL database)
- GitHub account with Personal Access Token (for repository operations)

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:OrderlyNetworkDexCreator/dex-creator.git
cd dex-creator
yarn install
```

### Environment Setup

The application requires several environment variables to be set for both frontend and backend.

1. **Create environment files from templates**:

```bash
# For API
cp api/.env.example api/.env

# For frontend
cp app/.env.example app/.env
```

2. **Configure environment variables**:

Edit both `.env` files with your specific configuration. See the [Environment Variables](#environment-variables) section for details.

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

## Environment Variables

The application requires several environment variables for proper operation. Below are the required variables for different components and features:

### API Server Environment (.env in api/ directory)

#### Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | API server port | 3001 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |

#### GitHub Integration

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub token for repo forking (needs 'admin:org' and 'repo' scopes) | Yes |
| `GITHUB_TEMPLATE_REPO` | Template repository to fork | Yes |
| `TEMPLATE_PAT` | Token for GitHub Pages deployments (needs 'repo' and 'workflow' permissions) | Yes |

#### Theme Generation

| Variable | Description | Required |
|----------|-------------|----------|
| `CEREBRAS_API_KEY` | API key for Cerebras AI theme generation | Yes |
| `CEREBRAS_API_URL` | Cerebras API endpoint | Yes |

#### DEX Graduation System

| Variable | Description | Required |
|----------|-------------|----------|
| `ETH_ORDER_ADDRESS` | Ethereum ORDER token address | Yes |
| `ARB_ORDER_ADDRESS` | Arbitrum ORDER token address | Yes |
| `ETH_RECEIVER_ADDRESS` | Ethereum wallet address to receive ORDER tokens | Yes |
| `ARB_RECEIVER_ADDRESS` | Arbitrum wallet address to receive ORDER tokens | Yes |
| `REQUIRED_ORDER_AMOUNT` | Amount of ORDER tokens required for graduation | Yes |
| `ETH_RPC_URL` | Ethereum RPC URL for transaction verification | Yes |
| `ARBITRUM_RPC_URL` | Arbitrum RPC URL for transaction verification | Yes |

### Frontend Environment (.env in app/ directory)

#### Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Frontend server port | 3000 | No |
| `NODE_ENV` | Environment (development/production) | development | No |

#### DEX Graduation System

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_ETH_ORDER_ADDRESS` | Ethereum ORDER token address | Yes |
| `VITE_ARB_ORDER_ADDRESS` | Arbitrum ORDER token address | Yes |
| `VITE_ETH_RECEIVER_ADDRESS` | Ethereum wallet address to receive ORDER tokens | Yes |
| `VITE_ARB_RECEIVER_ADDRESS` | Arbitrum wallet address to receive ORDER tokens | Yes |
| `VITE_REQUIRED_ORDER_AMOUNT` | Amount of ORDER tokens required for graduation | Yes |

**Important**: The ORDER token addresses and required amounts must match between frontend and backend environments.

## DEX Graduation System

The DEX Creator includes a graduation system that allows DEX owners to upgrade their exchange to earn fee revenue and enable trader rewards. The graduation process involves:

1. Users sending a specified amount of ORDER tokens (set by `REQUIRED_ORDER_AMOUNT`)
2. Choosing a unique broker ID for their DEX
3. Configuring custom maker and taker fees
4. Admin approval of the broker ID

### Setting Up the Graduation System

For the graduation system to work properly, you need to:

1. Set valid addresses for `ETH_RECEIVER_ADDRESS` and `ARB_RECEIVER_ADDRESS` in the API environment
2. Set the same addresses in `VITE_ETH_RECEIVER_ADDRESS` and `VITE_ARB_RECEIVER_ADDRESS` in the frontend environment
3. Configure working RPC URLs for Ethereum and Arbitrum in `ETH_RPC_URL` and `ARBITRUM_RPC_URL`
4. Set the same `REQUIRED_ORDER_AMOUNT` in both environments

### Testing the Graduation Process

For testing purposes, you may want to:

1. Use a testnet instead of mainnet by configuring appropriate RPC URLs
2. Set a smaller `REQUIRED_ORDER_AMOUNT` value (e.g., 10 instead of 1000)
3. Use test tokens instead of real ORDER tokens

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
# Build the API Docker image
docker build -t dex-creator-api .

# Run the API container with host networking
docker run -d \
  --name dex-creator-api \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dex_creator?schema=public \
  -e GITHUB_TOKEN=your-github-token \
  -e GITHUB_TEMPLATE_REPO=OrderlyNetworkDexCreator/dex-creator-template \
  -e TEMPLATE_PAT=your-template-personal-access-token \
  -e CEREBRAS_API_KEY=your-cerebras-api-key \
  -e CEREBRAS_API_URL=https://api.cerebras.ai/v1 \
  -e ETH_ORDER_ADDRESS=0xABD4C63d2616A5201454168269031355f4764337 \
  -e ARB_ORDER_ADDRESS=0x4E200fE2f3eFb977d5fd9c430A41531FB04d97B8 \
  -e ETH_RECEIVER_ADDRESS=0xyourEthereumReceiverAddress \
  -e ARB_RECEIVER_ADDRESS=0xyourArbitrumReceiverAddress \
  -e REQUIRED_ORDER_AMOUNT=1000 \
  -e ETH_RPC_URL=https://ethereum-rpc.publicnode.com \
  -e ARBITRUM_RPC_URL=https://arbitrum-one.public.blastapi.io \
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
