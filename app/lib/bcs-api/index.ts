// BCS API module exports
export { BCSApiClient } from './bcs-client';
export type {
  BCS_API_CONFIG,
  BCS_PORTFOLIO_ITEM,
  BCS_PORTFOLIO_DATA,
  BCS_PORTFOLIO_RESPONSE,
  BCS_AUTH_RESPONSE
} from './types';

// TODO: Add environment variable validation
// Client ID and secret should be loaded from environment variables:
// process.env.BCS_CLIENT_ID
// process.env.BCS_CLIENT_SECRET

/**
 * Factory function to create BCS API client with environment configuration
 */
export function createBCSClient(): BCSApiClient {
  const config = {
    clientId: process.env.BCS_CLIENT_ID || '',
    clientSecret: process.env.BCS_CLIENT_SECRET || ''
  };
  
  // TODO: Add validation for required environment variables
  if (!config.clientId || !config.clientSecret) {
    console.warn('BCS API credentials not configured. Using mock data.');
  }
  
  return new BCSApiClient(config);
}
