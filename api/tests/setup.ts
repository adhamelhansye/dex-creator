import { beforeAll, afterAll } from "vitest";
import {
  setupTestDatabases,
  cleanupTestDatabases,
} from "./utils/test-databases";

process.env.NODE_ENV = "test";

beforeAll(async () => {
  await setupTestDatabases();
});

afterAll(async () => {
  await cleanupTestDatabases();
});
