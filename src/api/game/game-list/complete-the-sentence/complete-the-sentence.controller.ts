import { Router } from 'express';

// Utility for validating game_id param (UUID)
import { validateAuth, validateBody } from '@/common';

import { ICompleteTheSentenceGameSchema } from './schema';

export const CompleteTheSentenceController = Router()
  // POST: Create new game (not exposed globally, for structure parity)
  .post(
    '/',
    validateAuth({}),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    validateBody({ schema: ICompleteTheSentenceGameSchema }),
    // ...rest of the logic
  );
