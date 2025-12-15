import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';

// Utility for validating game_id param (UUID)
import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { CompleteTheSentenceService } from './complete-the-sentence.service';
import {
  CheckCompleteTheSentenceAnswerSchema,
  CreateCompleteTheSentenceSchema,
  type ICheckCompleteTheSentenceAnswer,
  type ICreateCompleteTheSentence,
  type ITogglePublish,
  type IUpdateCompleteTheSentence,
  type IUpdateCompleteTheSentenceJson,
  TogglePublishSchema,
  UpdateCompleteTheSentenceJsonSchema,
  UpdateCompleteTheSentenceSchema,
} from './schema';

export const CompleteTheSentenceController = Router()
  // POST: Create new complete-the-sentence game
  .post(
    '/',
    validateAuth({ optional: false }),
    validateBody({
      schema: CreateCompleteTheSentenceSchema,
      file_fields: [{ name: 'thumbnail', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateCompleteTheSentence>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const userId = request.user?.user_id;
        const newGame =
          await CompleteTheSentenceService.createCompleteTheSentence(
            request.body,
            userId as string,
          );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Complete the Sentence game created',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // GET: Get game detail for editing
  .get(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await CompleteTheSentenceService.getGameDetail(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // GET: Get game for playing (public)
  .get(
    '/:game_id/play/public',
    async (
      request: Request<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await CompleteTheSentenceService.getGamePlay(
          request.params.game_id,
          true,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get public game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // GET: Get game for playing (private/preview)
  .get(
    '/:game_id/play/private',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await CompleteTheSentenceService.getGamePlay(
          request.params.game_id,
          false,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get private game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // PATCH: Update game (form-data with file upload)
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateCompleteTheSentenceSchema,
      file_fields: [{ name: 'thumbnail', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<
        { game_id: string },
        {},
        IUpdateCompleteTheSentence
      >,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await CompleteTheSentenceService.updateGame(
          request.body,
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // PUT: Update game (JSON body - for frontend edit page)
  .put(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateCompleteTheSentenceJsonSchema,
    }),
    async (
      request: AuthedRequest<
        { game_id: string },
        {},
        IUpdateCompleteTheSentenceJson
      >,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await CompleteTheSentenceService.updateGame(
          request.body,
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // POST: Check answer
  .post(
    '/:game_id/check',
    validateBody({ schema: CheckCompleteTheSentenceAnswerSchema }),
    async (
      request: Request<
        { game_id: string },
        {},
        ICheckCompleteTheSentenceAnswer
      >,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await CompleteTheSentenceService.checkAnswer(
          request.body,
          request.params.game_id,
        );
        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Answer checked successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // PATCH: Toggle publish status
  .patch(
    '/:game_id/publish',
    validateAuth({}),
    validateBody({ schema: TogglePublishSchema }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, ITogglePublish>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await CompleteTheSentenceService.togglePublish(
          request.params.game_id,
          request.body.is_published,
          request.user!.user_id,
          request.user!.role,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          `Game ${result.is_published ? 'published' : 'unpublished'} successfully`,
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  // DELETE: Delete game
  .delete(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await CompleteTheSentenceService.deleteGame(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Game deleted successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  );
