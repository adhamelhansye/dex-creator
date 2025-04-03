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

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:OrderlyNetwork/dex-creator.git
cd dex-creator
yarn install
```

### Development

To start the development servers for both the app and api:

```bash
# In separate terminals:
# For the frontend app
cd app
yarn dev

# For the backend API
cd api
yarn dev
```

## Deployment

The project automatically deploys to GitHub Pages through the CI pipeline when changes are pushed to the main branch.

## License

MIT
