# API Integration Tests

This directory contains integration tests for the DEX Creator API. These tests use real databases (PostgreSQL and MySQL) running in Docker containers to ensure comprehensive testing of the API functionality.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and teardown
├── utils/
│   ├── test-databases.ts       # Database container management
│   ├── test-helpers.ts         # Test data factories and utilities
│   └── test-app.ts            # Test app setup and mocking
├── routes/
│   ├── auth.test.ts           # Authentication route tests
│   ├── dex.test.ts            # DEX management route tests
│   ├── admin.test.ts          # Admin route tests
│   └── graduation.test.ts     # Graduation route tests
└── README.md                  # This file
```

## Test Features

### Real Database Testing
- **PostgreSQL**: Main application database with Prisma ORM
- **MySQL**: Orderly database for broker management
- **Testcontainers**: Automated Docker container management
- **Data Isolation**: Each test run gets fresh databases

### Comprehensive Coverage
- **Authentication**: Nonce generation, signature verification, token validation
- **DEX Management**: CRUD operations, validation, business logic
- **Admin Functions**: Role-based access control, DEX deletion
- **Graduation**: Transaction verification, fee management, broker creation

### Test Utilities
- **TestDataFactory**: Creates test users, DEXs, and tokens
- **Mock Data Generators**: Realistic test data for all entities
- **Authentication Helpers**: Wallet creation, signature generation
- **Database Cleanup**: Automatic cleanup between tests
- **Comprehensive Mocking**: External services, graduation functions, and database operations

## Running Tests

### Prerequisites
- Docker installed and running
- Node.js v22 or later
- Yarn package manager

### Commands

```bash
# Run all tests
yarn test

# Run tests with UI
yarn test:ui

# Run tests once (no watch mode)
yarn test:run

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test auth.test.ts

# Run tests matching pattern
yarn test --grep "should create a new DEX"
```

### Test Environment

Tests automatically:
1. Start PostgreSQL and MySQL containers
2. Run database migrations
3. Set up test data
4. Execute tests
5. Clean up containers

## Test Data

### Test Users
- Regular users with wallet addresses
- Admin users with elevated privileges
- Authentication tokens with configurable expiration

### Test DEXs
- Complete DEX configurations
- Custom branding (logos, themes)
- Social links and SEO settings
- Fee structures and chain configurations

### Test Brokers
- Orderly broker records (when needed for graduation tests)
- Fee configurations
- Admin account mappings

## Mocking Strategy

### External Services
- **GitHub API**: Repository creation and management
- **Rate Limiters**: Deployment restrictions
- **Broker Creation**: EVM/Solana operations
- **Graduation Functions**: Transaction verification, fee management, broker creation

### Authentication
- **Middleware**: Configurable user context
- **Admin Checks**: Role-based access control
- **Token Validation**: Expiration and validity

## Best Practices

### Test Organization
- One test file per route group
- Descriptive test names
- Proper setup and teardown
- Isolated test data

### Data Management
- Use TestDataFactory for consistent data creation
- Clean up test data between tests
- Use realistic mock data
- Test edge cases and error conditions

### Assertions
- Test both success and error cases
- Verify response structure and content
- Check database state changes
- Validate business logic

## Troubleshooting

### Common Issues

1. **Docker not running**: Ensure Docker is installed and running
2. **Port conflicts**: Tests use random ports, but ensure no conflicts
3. **Memory issues**: Testcontainers can be memory-intensive
4. **Slow tests**: Database operations take time, tests have 60s timeout

### Debug Mode

```bash
# Run tests with verbose output
yarn test --reporter=verbose

# Run single test with debug
yarn test --grep "specific test" --reporter=verbose
```

### Database Access

During test development, you can access the test databases:
- PostgreSQL: Port will be logged during test setup
- MySQL: Port will be logged during test setup
- Use the connection strings from test output

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use TestDataFactory for data creation
3. Add proper cleanup in afterEach hooks
4. Test both success and error cases
5. Update this README if adding new test utilities

## Performance

- Tests run in parallel where possible
- Database containers are reused across test files
- Test data is cleaned up efficiently
- Graduation tests include comprehensive mocking for fast execution
