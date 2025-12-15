/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { type ICompleteTheSentenceGame } from 'src/common/interface/games/complete-the-sentence.interface';
import { v4 } from 'uuid';

import { ErrorResponse, prisma } from '@/common';
import { FileManager } from '@/utils';

import {
  type ICheckCompleteTheSentenceAnswer,
  type ICreateCompleteTheSentence,
  type IUpdateCompleteTheSentence,
  type IUpdateCompleteTheSentenceJson,
} from './schema';

export class CompleteTheSentenceService {
  // Slug for this game type (should match the slug in your gameTemplates table)
  private static completeTheSentenceSlug = 'complete-the-sentence';

  static async createCompleteTheSentence(
    data: ICreateCompleteTheSentence,
    user_id: string,
  ) {
    // Check if game with same name exists
    const existingGame = await prisma.games.findFirst({
      where: { name: data.title },
    });

    if (existingGame) {
      throw new ErrorResponse(
        StatusCodes.CONFLICT,
        'Game with this name already exists',
      );
    }

    const newGameId = v4();
    const templateId = await this.getGameTemplateId();

    // Upload thumbnail
    const thumbnailPath = await FileManager.upload(
      `game/complete-the-sentence/${newGameId}`,
      data.thumbnail,
    );

    // Build the game JSON
    const gameJson: ICompleteTheSentenceGame = {
      questions: data.questions.map(q => ({
        leftClause: q.left_clause,
        rightClause: q.right_clause,
        availableConjunctions: q.conjunctions,
        correctAnswer: `${q.left_clause}, ${q.conjunctions[0]} ${q.right_clause}.`,
        explanation: q.explanation,
      })),
    };

    const newGame = await prisma.games.create({
      data: {
        id: newGameId,
        game_template_id: templateId,
        creator_id: user_id,
        name: data.title,
        description: data.description,
        thumbnail_image: thumbnailPath,
        is_published: data.is_published,
        game_json: gameJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getGameDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        created_at: true,
        game_json: true,
        creator_id: true,
        total_played: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.completeTheSentenceSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    return {
      ...game,
      creator_id: undefined,
      game_template: undefined,
    };
  }

  static async getGamePlay(
    game_id: string,
    is_public: boolean,
    user_id?: string,
    user_role?: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        creator: {
          select: { username: true },
        },
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.completeTheSentenceSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    // If public access, game must be published
    if (is_public && !game.is_published)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    // If private access, check permission
    if (!is_public) {
      if (!user_id || !user_role)
        throw new ErrorResponse(
          StatusCodes.UNAUTHORIZED,
          'User not authenticated',
        );

      if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
        throw new ErrorResponse(
          StatusCodes.FORBIDDEN,
          'User cannot access this game',
        );
    }

    const gameJson = game.game_json as unknown as ICompleteTheSentenceGame;

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      creator_name: game.creator.username,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      questions: gameJson.questions.map(
        (q: {
          leftClause: any;
          rightClause: any;
          availableConjunctions: any;
        }) => ({
          leftClause: q.leftClause,
          rightClause: q.rightClause,
          availableConjunctions: q.availableConjunctions,
        }),
      ),
    };
  }

  static async updateGame(
    data: IUpdateCompleteTheSentence | IUpdateCompleteTheSentenceJson,
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.completeTheSentenceSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    // Support both 'title' and 'name' fields
    const newTitle =
      data.title || (data as IUpdateCompleteTheSentenceJson).name;

    // Check if new name is already used
    if (newTitle) {
      const isNameExist = await prisma.games.findFirst({
        where: { name: newTitle },
        select: { id: true },
      });

      if (isNameExist && isNameExist.id !== game_id)
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          'Game name is already used',
        );
    }

    // Handle thumbnail update (only for form-data requests)
    let thumbnailPath = game.thumbnail_image;

    if ('thumbnail' in data && data.thumbnail) {
      // Delete old thumbnail
      if (game.thumbnail_image) {
        await FileManager.remove(game.thumbnail_image);
      }

      // Upload new thumbnail
      thumbnailPath = await FileManager.upload(
        `game/complete-the-sentence/${game_id}`,
        data.thumbnail,
      );
    }

    // Handle game JSON update
    let gameJson = game.game_json as unknown as ICompleteTheSentenceGame;

    if (data.questions) {
      gameJson = {
        questions: data.questions.map(q => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          leftClause: q.left_clause,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          rightClause: q.right_clause,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          availableConjunctions: q.conjunctions,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          correctAnswer: `${q.left_clause}, ${q.conjunctions[0]} ${q.right_clause}.`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          explanation: q.explanation,
        })),
      };
    }

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: {
        name: newTitle ?? game.name,
        description: data.description ?? game.description,
        thumbnail_image: thumbnailPath,
        is_published: data.is_published ?? game.is_published,
        game_json: gameJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return updatedGame;
  }

  static async deleteGame(game_id: string, user_id: string, user_role: ROLE) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        thumbnail_image: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.completeTheSentenceSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot delete this game',
      );

    // Delete thumbnail file
    if (game.thumbnail_image) {
      await FileManager.remove(game.thumbnail_image);
    }

    // Delete game folder
    await FileManager.removeFolder(
      `uploads/game/complete-the-sentence/${game_id}`,
    );

    // Delete from database
    await prisma.games.delete({
      where: { id: game_id },
    });

    return { id: game_id };
  }

  static async togglePublish(
    game_id: string,
    is_published: boolean,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.completeTheSentenceSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot modify this game',
      );

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: { is_published },
      select: {
        id: true,
        is_published: true,
      },
    });

    return updatedGame;
  }

  static async checkAnswer(
    data: ICheckCompleteTheSentenceAnswer,
    game_id: string,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        game_json: true,
        is_published: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.completeTheSentenceSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (!game.is_published)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    const gameJson = game.game_json as unknown as ICompleteTheSentenceGame;

    if (
      data.question_index < 0 ||
      data.question_index >= gameJson.questions.length
    )
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Invalid question index',
      );

    const question = gameJson.questions[data.question_index];
    const isCorrect =
      question.availableConjunctions[0] === data.selected_conjunction;

    return {
      is_correct: isCorrect,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  private static async getGameTemplateId(): Promise<string> {
    const template = await prisma.gameTemplates.findUnique({
      where: { slug: this.completeTheSentenceSlug },
      select: { id: true },
    });

    if (!template) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'Complete the Sentence game template not found',
      );
    }

    return template.id;
  }

  // Return static game data (could be loaded from DB or file in the future)
  static getGameData(): ICompleteTheSentenceGame {
    return {
      questions: [
        {
          leftClause: 'I wanted to go for a walk',
          rightClause: 'it was raining',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'I wanted to go for a walk, but it was raining.',
          explanation: "Use 'but' to show contrast.",
        },
        {
          leftClause: 'She studied hard',
          rightClause: 'she passed the test',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'She studied hard, so she passed the test.',
          explanation: "Use 'so' to show result.",
        },
        {
          leftClause: 'He can go to the party',
          rightClause: 'he finishes his homework',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'He can go to the party if he finishes his homework.',
          explanation: "Use 'if' to show condition.",
        },
        {
          leftClause: 'The sun was shining',
          rightClause: 'it was cold outside',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'The sun was shining, but it was cold outside.',
          explanation: "Use 'but' to show contrast.",
        },
        {
          leftClause: "He didn't study",
          rightClause: 'he failed the exam',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: "He didn't study, so he failed the exam.",
          explanation: "Use 'so' to show result.",
        },
      ],
    };
  }

  // Used by the main game service to inject content for this game type
  static injectContentIfCompleteTheSentence(slug: string) {
    if (slug === this.completeTheSentenceSlug) {
      return this.getGameData();
    }

    return null;
  }
}
