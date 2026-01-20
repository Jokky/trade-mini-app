import { BCSClient } from './bcs-client';
import type {
  BCSAuthResponse,
  BCSPortfolioResponse,
  BCSApiResponse,
  BCSClientConfig,
  BCSPortfolioPosition
} from './types';

export const createBCSClient = (config: BCSClientConfig): BCSClient => {
  return new BCSClient(config);
};

export type {
  BCSAuthResponse,
  BCSPortfolioResponse,
  BCSApiResponse,
  BCSClientConfig,
  BCSPortfolioPosition
};

export default BCSClient;
