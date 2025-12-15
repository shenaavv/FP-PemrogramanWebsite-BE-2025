import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import {
  CheckAnswerSchema,
  CreateQuestionSchema,
  CreateWorditSchema,
  type ICheckAnswer,
  type ICreateQuestion,
  type ICreateWordit,
  type ISubmitAnswers,
  type IUpdateQuestion,
  type IUpdateWordit,
  SubmitAnswersSchema,
  UpdateQuestionSchema,
  UpdateWorditSchema,
} from './schema';
import { WorditService } from './wordit.service';

export const WorditController = Router()
  // ===========================
  // GAME MANAGEMENT ENDPOINTS
  // ===========================

  /**
   * POST /games - Create a new WordIt game (draft)
   */
  .post(
    '/games',
    validateAuth({}),
    validateBody({
      schema: CreateWorditSchema,
      file_fields: [{ name: 'thumbnail', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateWordit>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newGame = await WorditService.createGame(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Game created successfully',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * GET /games - List user's games
   */
  .get(
    '/games',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const games = await WorditService.getUserGames(request.user!.user_id);
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Games retrieved successfully',
          games,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * GET /games/:gameId - Get game detail
   */
  .get(
    '/games/:gameId',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await WorditService.getGameDetail(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game retrieved successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * PUT /games/:gameId - Update game
   */
  .put(
    '/games/:gameId',
    validateAuth({}),
    validateBody({
      schema: UpdateWorditSchema,
      file_fields: [{ name: 'thumbnail', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<{ gameId: string }, {}, IUpdateWordit>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await WorditService.updateGame(
          request.params.gameId,
          request.body,
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

  /**
   * DELETE /games/:gameId - Delete game
   */
  .delete(
    '/games/:gameId',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const deleteResult = await WorditService.deleteGame(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          deleteResult.message,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // ===========================
  // QUESTION MANAGEMENT ENDPOINTS
  // ===========================

  /**
   * POST /games/:gameId/questions - Add question to game
   */
  .post(
    '/games/:gameId/questions',
    validateAuth({}),
    validateBody({ schema: CreateQuestionSchema }),
    async (
      request: AuthedRequest<{ gameId: string }, {}, ICreateQuestion>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newQuestion = await WorditService.addQuestion(
          request.params.gameId,
          request.body,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Question added successfully',
          newQuestion,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * GET /games/:gameId/questions - Get all questions
   */
  .get(
    '/games/:gameId/questions',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const questions = await WorditService.getQuestions(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Questions retrieved successfully',
          questions,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * GET /games/:gameId/questions/:questionId - Get specific question
   */
  .get(
    '/games/:gameId/questions/:questionId',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string; questionId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const question = await WorditService.getQuestion(
          request.params.gameId,
          request.params.questionId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Question retrieved successfully',
          question,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * PUT /games/:gameId/questions/:questionId - Update question
   */
  .put(
    '/games/:gameId/questions/:questionId',
    validateAuth({}),
    validateBody({ schema: UpdateQuestionSchema }),
    async (
      request: AuthedRequest<
        { gameId: string; questionId: string },
        {},
        IUpdateQuestion
      >,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedQuestion = await WorditService.updateQuestion(
          request.params.gameId,
          request.params.questionId,
          request.body,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Question updated successfully',
          updatedQuestion,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * DELETE /games/:gameId/questions/:questionId - Delete question
   */
  .delete(
    '/games/:gameId/questions/:questionId',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string; questionId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const deleteResult = await WorditService.deleteQuestion(
          request.params.gameId,
          request.params.questionId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          deleteResult.message,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // ===========================
  // PUBLISH/UNPUBLISH ENDPOINTS
  // ===========================

  /**
   * PATCH /games/:gameId/publish - Publish a game
   */
  .patch(
    '/games/:gameId/publish',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const publishResult = await WorditService.publishGame(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          publishResult.message,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * PATCH /games/:gameId/unpublish - Unpublish a game
   */
  .patch(
    '/games/:gameId/unpublish',
    validateAuth({}),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const unpublishResult = await WorditService.unpublishGame(
          request.params.gameId,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          unpublishResult.message,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  // ===========================
  // PLAY GAME ENDPOINTS
  // ===========================

  /**
   * GET /play/:gameId - Get game for playing (without correct answers)
   */
  .get(
    '/play/:gameId',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameData = await WorditService.getGameForPlay(
          request.params.gameId,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Game loaded successfully',
          gameData,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * POST /play/:gameId/answer - Check a single answer
   */
  .post(
    '/play/:gameId/answer',
    validateAuth({ optional: true }),
    validateBody({ schema: CheckAnswerSchema }),
    async (
      request: AuthedRequest<{ gameId: string }, {}, ICheckAnswer>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const answerResult = await WorditService.checkAnswer(
          request.params.gameId,
          request.body,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Answer checked',
          answerResult,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * POST /play/:gameId/submit - Submit all answers
   */
  .post(
    '/play/:gameId/submit',
    validateAuth({ optional: true }),
    validateBody({ schema: SubmitAnswersSchema }),
    async (
      request: AuthedRequest<{ gameId: string }, {}, ISubmitAnswers>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const submitResult = await WorditService.submitAnswers(
          request.params.gameId,
          request.body,
          request.user?.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Answers submitted successfully',
          submitResult,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )

  /**
   * GET /play/:gameId/result - Get game results/leaderboard
   */
  .get(
    '/play/:gameId/result',
    validateAuth({ optional: true }),
    async (
      request: AuthedRequest<{ gameId: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const results = await WorditService.getGameResults(
          request.params.gameId,
          request.user?.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Results retrieved successfully',
          results,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
