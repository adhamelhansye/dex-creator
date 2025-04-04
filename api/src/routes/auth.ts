import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ethers } from 'ethers';
import { userStore, authRequestSchema, authVerifySchema } from '../models/user';
import { z } from 'zod';

const app = new Hono();

// Schema for token verification
const tokenVerifySchema = z.object({
  address: z.string(),
  token: z.string(),
});

// Generate a nonce for the user to sign
app.post('/nonce', zValidator('json', authRequestSchema), async c => {
  const { address } = c.req.valid('json');

  try {
    const nonce = await userStore.generateNonce(address);
    const message = `Sign this message to authenticate with DEX Creator: ${nonce}`;

    return c.json({
      message,
      nonce,
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return c.json({ error: 'Failed to generate authentication nonce' }, 500);
  }
});

// Verify signature and authenticate user
app.post('/verify', zValidator('json', authVerifySchema), async c => {
  const { address, signature } = c.req.valid('json');

  try {
    const user = await userStore.findByAddress(address);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const message = `Sign this message to authenticate with DEX Creator: ${user.nonce}`;

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Generate a new nonce for security
    await userStore.generateNonce(address);

    // Create a token with expiration
    const token = userStore.createToken(user.id!);

    return c.json({
      user: {
        address: user.address,
        id: user.id,
      },
      token,
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Verify if a token is still valid
app.post('/validate', zValidator('json', tokenVerifySchema), async c => {
  const { address, token } = c.req.valid('json');

  try {
    const user = await userStore.findByAddress(address);
    if (!user) {
      return c.json({ valid: false, error: 'User not found' }, 404);
    }

    // Validate the token
    const isValid = userStore.validateToken(token, user.id!);

    if (!isValid) {
      return c.json(
        {
          valid: false,
          error: 'Token invalid or expired',
        },
        401
      );
    }

    return c.json({
      valid: true,
      user: {
        address: user.address,
        id: user.id,
      },
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return c.json({ valid: false, error: 'Token validation failed' }, 500);
  }
});

export default app;
