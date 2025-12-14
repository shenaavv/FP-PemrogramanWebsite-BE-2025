import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  type AuthedRequest,
  SuccessResponse,
  ErrorResponse,
  validateAuth,
  validateBody,
} from '@/common';
import { CompleteTheSentenceService } from './complete-the-sentence.service';
import {
  CompleteTheSentenceGameSchema,
  CompleteTheSentenceQuestionSchema,
} from './schema';

// Utility for validating game_id param (UUID)
import z from 'zod';
const GameIdSchema = z.object({ game_id: z.string().uuid() });
const validateGameId = (parameters: unknown) => {
  const validationResult = GameIdSchema.safeParse(parameters);
  if (!validationResult.success) {
    throw new ErrorResponse(
      StatusCodes.BAD_REQUEST,
      'Invalid game ID format (must be UUID)',
    );
  }
  return validationResult.data.game_id;
};

export const CompleteTheSentenceController = Router()
  // POST: Create new game (not exposed globally, for structure parity)
  .post(
    '/',
    validateAuth({}),
    validateBody({ schema: CompleteTheSentenceGameSchema }),
    // ...rest of the logic
  );
