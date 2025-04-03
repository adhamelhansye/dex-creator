import { z } from 'zod';

// Define a type for DEX configuration
export interface DexConfig {
  id: string;
  name: string;
  description: string;
  logo?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Create schema for validation
export const dexSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500),
  logo: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  }),
});

// In-memory storage for DEX configurations
// In a real app, this would be a database
export const dexStorage: Record<string, DexConfig> = {};

// Helper function to generate a simple ID
export function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
