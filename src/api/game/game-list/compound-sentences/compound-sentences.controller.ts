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
import { CompoundSentencesService } from './compound-sentences.service';
import {
	CompoundSentencesGameSchema,
	CompoundSentencesQuestionSchema,
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

export const CompoundSentencesController = Router()
	// POST: Create new game (not exposed globally, for structure parity)
	.post(
		'/',
		validateAuth({}),
		validateBody({ schema: CompoundSentencesGameSchema }),
		async (
			request: AuthedRequest<{}, {}, any>,
			response: Response,
			next: NextFunction,
		) => {
			try {
				// This would call a create method if implemented
				// const newGame = await CompoundSentencesService.createCompoundSentences(request.body, request.user!.user_id);
				const result = new SuccessResponse(
					StatusCodes.CREATED,
					'Compound Sentences game created (stub)',
					{},
				);
				return response.status(result.statusCode).json(result.json());
			} catch (error) {
				return next(error);
			}
		},
	)
	// GET: Detail game (creator/admin access)
	.get(
		'/:game_id',
		validateAuth({}),
		async (
			request: AuthedRequest<{ game_id: string }>,
			response: Response,
			next: NextFunction,
		) => {
			try {
				const gameId = validateGameId(request.params);
				// This would call a detail method if implemented
				// const game = await CompoundSentencesService.getCompoundSentencesGameDetail(gameId, request.user!.user_id, request.user!.role);
				const service = new CompoundSentencesService();
				const game = service.getGameData();
				const result = new SuccessResponse(
					StatusCodes.OK,
					'Get compound sentences game successfully',
					game,
				);
				return response.status(result.statusCode).json(result.json());
			} catch (error) {
				return next(error);
			}
		},
	)
	// GET: Play public game (shuffled)
	.get(
		'/:game_id/play/public',
		validateAuth({ optional: true }),
		async (
			request: Request<{ game_id: string }>,
			response: Response,
			next: NextFunction,
		) => {
			try {
				const gameId = validateGameId(request.params);
				const service = new CompoundSentencesService();
				const game = service.getGameData();
				// Optionally shuffle questions here if needed
				const result = new SuccessResponse(
					StatusCodes.OK,
					'Get public compound sentences game successfully',
					game,
				);
				return response.status(result.statusCode).json(result.json());
			} catch (error) {
				return next(error);
			}
		},
	)
	// PATCH: Update game (not exposed globally, for structure parity)
	.patch(
		'/:game_id',
		validateAuth({}),
		validateBody({ schema: CompoundSentencesGameSchema }),
		async (
			request: AuthedRequest<{ game_id: string }, {}, any>,
			response: Response,
			next: NextFunction,
		) => {
			try {
				const gameId = validateGameId(request.params);
				// This would call an update method if implemented
				// const updatedGame = await CompoundSentencesService.updateCompoundSentences(request.body, gameId, request.user!.user_id, request.user!.role);
				const result = new SuccessResponse(
					StatusCodes.OK,
					'Compound Sentences game updated (stub)',
					{},
				);
				return response.status(result.statusCode).json(result.json());
			} catch (error) {
				return next(error);
			}
		},
	)
	// POST: Check answer (not implemented, for structure parity)
	.post(
		'/:game_id/check',
		validateAuth({}),
		validateBody({ schema: CompoundSentencesQuestionSchema }),
		async (
			request: AuthedRequest<{ game_id: string }, {}, any>,
			response: Response,
			next: NextFunction,
		) => {
			try {
				const gameId = validateGameId(request.params);
				// This would call a checkAnswer method if implemented
				// const resultData = await CompoundSentencesService.checkAnswer(request.body, gameId);
				const result = new SuccessResponse(
					StatusCodes.OK,
					'Compound Sentences answer checked (stub)',
					{},
				);
				return response.status(result.statusCode).json(result.json());
			} catch (error) {
				return next(error);
			}
		},
	)
	// DELETE: Delete game (not exposed globally, for structure parity)
	.delete(
		'/:game_id',
		validateAuth({}),
		async (
			request: AuthedRequest<{ game_id: string }>,
			response: Response,
			next: NextFunction,
		) => {
			try {
				const gameId = validateGameId(request.params);
				// This would call a delete method if implemented
				// const resultData = await CompoundSentencesService.deleteCompoundSentences(gameId, request.user!.user_id, request.user!.role);
				const result = new SuccessResponse(
					StatusCodes.OK,
					'Compound Sentences game deleted (stub)',
					{},
				);
				return response.status(result.statusCode).json(result.json());
			} catch (error) {
				return next(error);
			}
		},
	);
