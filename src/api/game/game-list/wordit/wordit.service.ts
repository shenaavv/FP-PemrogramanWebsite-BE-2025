import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, prisma } from '@/common';
import { FileManager } from '@/utils';

import {
  type ICheckAnswer,
  type ICreateQuestion,
  type ICreateWordit,
  type ISubmitAnswers,
  type IUpdateQuestion,
  type IUpdateWordit,
} from './schema';

// Interface for the game JSON structure
interface IWorditGameJson {
  questions: Array<{
    id: string;
    sentence: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }>;
}

export abstract class WorditService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static WORDIT_SLUG = 'wordit';

  // ===========================
  // GAME MANAGEMENT
  // ===========================

  /**
   * Create a new WordIt game (draft)
   */
  static async createGame(data: ICreateWordit, user_id: string) {
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
      `game/wordit/${newGameId}`,
      data.thumbnail,
    );

    // Build initial game JSON with questions if provided
    const gameJson: IWorditGameJson = {
      questions: data.questions
        ? data.questions.map(q => ({
            id: v4(),
            sentence: q.sentence,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
          }))
        : [],
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
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        created_at: true,
      },
    });

    return newGame;
  }

  /**
   * Get all games for a user
   */
  static async getUserGames(user_id: string) {
    const games = await prisma.games.findMany({
      where: {
        creator_id: user_id,
        game_template: { slug: this.WORDIT_SLUG },
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        total_played: true,
        created_at: true,
        updated_at: true,
        game_json: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return games.map(game => ({
      ...game,
      question_count:
        (game.game_json as unknown as IWorditGameJson).questions?.length || 0,
      game_json: undefined,
    }));
  }

  /**
   * Get game detail by ID
   */
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
        total_played: true,
        created_at: true,
        updated_at: true,
        game_json: true,
        creator_id: true,
        game_template: { select: { slug: true } },
      },
    });

    if (!game || game.game_template.slug !== this.WORDIT_SLUG) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    // Only owner or super admin can view game details
    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You do not have permission to view this game',
      );
    }

    return {
      ...game,
      creator_id: undefined,
      game_template: undefined,
    };
  }

  /**
   * Update a game
   */
  static async updateGame(
    game_id: string,
    data: IUpdateWordit,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );

    let thumbnailPath = game.thumbnail_image;

    if (data.thumbnail) {
      // Remove old thumbnail
      await FileManager.remove(game.thumbnail_image);
      // Upload new thumbnail
      thumbnailPath = await FileManager.upload(
        `game/wordit/${game_id}`,
        data.thumbnail,
      );
    }

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: {
        name: data.title,
        description: data.description,
        thumbnail_image: thumbnailPath,
        is_published: data.is_published,
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        updated_at: true,
      },
    });

    return updatedGame;
  }

  /**
   * Delete a game
   */
  static async deleteGame(game_id: string, user_id: string, user_role: ROLE) {
    await this.getGameAndVerifyOwnership(game_id, user_id, user_role);

    // Delete game folder with all files
    await FileManager.removeFolder(`./uploads/game/wordit/${game_id}`);

    await prisma.games.delete({
      where: { id: game_id },
    });

    return { message: 'Game deleted successfully' };
  }

  // ===========================
  // QUESTION MANAGEMENT
  // ===========================

  /**
   * Add a question to a game
   */
  static async addQuestion(
    game_id: string,
    data: ICreateQuestion,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );
    const gameJson = game.game_json as unknown as IWorditGameJson;

    // Validate that correct_answer is in options
    if (!data.options.includes(data.correct_answer)) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Correct answer must be one of the options',
      );
    }

    const newQuestion = {
      id: v4(),
      sentence: data.sentence,
      options: data.options,
      correct_answer: data.correct_answer,
      explanation: data.explanation,
    };

    gameJson.questions.push(newQuestion);

    await prisma.games.update({
      where: { id: game_id },
      data: { game_json: gameJson as unknown as Prisma.InputJsonValue },
    });

    return newQuestion;
  }

  /**
   * Get all questions for a game
   */
  static async getQuestions(game_id: string, user_id: string, user_role: ROLE) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );
    const gameJson = game.game_json as unknown as IWorditGameJson;

    return gameJson.questions || [];
  }

  /**
   * Get a specific question
   */
  static async getQuestion(
    game_id: string,
    question_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );
    const gameJson = game.game_json as unknown as IWorditGameJson;

    const question = gameJson.questions.find(q => q.id === question_id);

    if (!question) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Question not found');
    }

    return question;
  }

  /**
   * Update a question
   */
  static async updateQuestion(
    game_id: string,
    question_id: string,
    data: IUpdateQuestion,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );
    const gameJson = game.game_json as unknown as IWorditGameJson;

    const questionIndex = gameJson.questions.findIndex(
      q => q.id === question_id,
    );

    if (questionIndex === -1) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Question not found');
    }

    const question = gameJson.questions[questionIndex];

    // Update fields if provided
    if (data.sentence) question.sentence = data.sentence;
    if (data.options) question.options = data.options;
    if (data.correct_answer) question.correct_answer = data.correct_answer;
    if (data.explanation !== undefined) question.explanation = data.explanation;

    // Validate that correct_answer is in options
    if (!question.options.includes(question.correct_answer)) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Correct answer must be one of the options',
      );
    }

    gameJson.questions[questionIndex] = question;

    await prisma.games.update({
      where: { id: game_id },
      data: { game_json: gameJson as unknown as Prisma.InputJsonValue },
    });

    return question;
  }

  /**
   * Delete a question
   */
  static async deleteQuestion(
    game_id: string,
    question_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );
    const gameJson = game.game_json as unknown as IWorditGameJson;

    const questionIndex = gameJson.questions.findIndex(
      q => q.id === question_id,
    );

    if (questionIndex === -1) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Question not found');
    }

    gameJson.questions.splice(questionIndex, 1);

    await prisma.games.update({
      where: { id: game_id },
      data: { game_json: gameJson as unknown as Prisma.InputJsonValue },
    });

    return { message: 'Question deleted successfully' };
  }

  // ===========================
  // PUBLISH/UNPUBLISH
  // ===========================

  /**
   * Publish a game
   */
  static async publishGame(game_id: string, user_id: string, user_role: ROLE) {
    const game = await this.getGameAndVerifyOwnership(
      game_id,
      user_id,
      user_role,
    );
    const gameJson = game.game_json as unknown as IWorditGameJson;

    // Ensure game has at least 1 question before publishing
    if (!gameJson.questions || gameJson.questions.length === 0) {
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Cannot publish a game without questions',
      );
    }

    await prisma.games.update({
      where: { id: game_id },
      data: { is_published: true },
    });

    return { message: 'Game published successfully' };
  }

  /**
   * Unpublish a game
   */
  static async unpublishGame(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    await this.getGameAndVerifyOwnership(game_id, user_id, user_role);

    await prisma.games.update({
      where: { id: game_id },
      data: { is_published: false },
    });

    return { message: 'Game unpublished successfully' };
  }

  // ===========================
  // PLAY GAME
  // ===========================

  /**
   * Get game for playing (without correct answers)
   */
  static async getGameForPlay(game_id: string) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        game_template: { select: { slug: true } },
      },
    });

    if (!game || game.game_template.slug !== this.WORDIT_SLUG) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    if (!game.is_published) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'This game is not published yet',
      );
    }

    const gameJson = game.game_json as unknown as IWorditGameJson;

    // Return questions WITHOUT correct answers
    const questionsForPlay = gameJson.questions.map(q => ({
      id: q.id,
      sentence: q.sentence,
      options: q.options,
      // Note: correct_answer and explanation are NOT included
    }));

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      total_questions: questionsForPlay.length,
      questions: questionsForPlay,
    };
  }

  /**
   * Check a single answer
   */
  static async checkAnswer(game_id: string, data: ICheckAnswer) {
    const game = await this.getPublishedGame(game_id);
    const gameJson = game.game_json as unknown as IWorditGameJson;

    const question = gameJson.questions.find(q => q.id === data.question_id);

    if (!question) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Question not found');
    }

    const isCorrect =
      question.correct_answer.toLowerCase() === data.answer.toLowerCase();

    return {
      question_id: data.question_id,
      is_correct: isCorrect,
      correct_answer: isCorrect ? undefined : question.correct_answer,
      explanation: question.explanation,
    };
  }

  /**
   * Submit all answers and calculate final score
   */
  static async submitAnswers(
    game_id: string,
    data: ISubmitAnswers,
    user_id?: string,
  ) {
    const game = await this.getPublishedGame(game_id);
    const gameJson = game.game_json as unknown as IWorditGameJson;

    let correctCount = 0;
    const results: Array<{
      question_id: string;
      is_correct: boolean;
      correct_answer: string;
      user_answer: string;
      explanation?: string;
    }> = [];

    for (const answer of data.answers) {
      const question = gameJson.questions.find(
        q => q.id === answer.question_id,
      );

      if (!question) continue;

      const isCorrect =
        question.correct_answer.toLowerCase() === answer.answer.toLowerCase();

      if (isCorrect) correctCount++;

      results.push({
        question_id: answer.question_id,
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        user_answer: answer.answer,
        explanation: question.explanation,
      });
    }

    const totalQuestions = gameJson.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Update total_played
    await prisma.games.update({
      where: { id: game_id },
      data: { total_played: { increment: 1 } },
    });

    // Save to leaderboard
    await prisma.leaderboard.create({
      data: {
        user_id: user_id || null,
        game_id: game_id,
        score: score,
        time_taken: data.time_taken,
      },
    });

    // Update user's total_game_played if authenticated
    if (user_id) {
      await prisma.users.update({
        where: { id: user_id },
        data: { total_game_played: { increment: 1 } },
      });
    }

    return {
      total_questions: totalQuestions,
      correct_answers: correctCount,
      wrong_answers: totalQuestions - correctCount,
      score: score,
      time_taken: data.time_taken,
      results: results,
    };
  }

  /**
   * Get play result/leaderboard for a game
   */
  static async getGameResults(game_id: string, user_id?: string) {
    await this.getPublishedGame(game_id);

    const leaderboard = await prisma.leaderboard.findMany({
      where: { game_id },
      select: {
        id: true,
        score: true,
        time_taken: true,
        created_at: true,
        user: {
          select: {
            id: true,
            username: true,
            profile_picture: true,
          },
        },
      },
      orderBy: [{ score: 'desc' }, { time_taken: 'asc' }],
      take: 50,
    });

    // Get user's own results if authenticated
    let userResults = null;

    if (user_id) {
      userResults = await prisma.leaderboard.findMany({
        where: { game_id, user_id },
        select: {
          id: true,
          score: true,
          time_taken: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      });
    }

    return {
      leaderboard,
      user_results: userResults,
    };
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private static async getGameTemplateId(): Promise<string> {
    const template = await prisma.gameTemplates.findUnique({
      where: { slug: this.WORDIT_SLUG },
      select: { id: true },
    });

    if (!template) {
      throw new ErrorResponse(
        StatusCodes.NOT_FOUND,
        'WordIt game template not found. Please seed the database first.',
      );
    }

    return template.id;
  }

  private static async getGameAndVerifyOwnership(
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
        game_template: { select: { slug: true } },
      },
    });

    if (!game || game.game_template.slug !== this.WORDIT_SLUG) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'You do not have permission to modify this game',
      );
    }

    return game;
  }

  private static async getPublishedGame(game_id: string) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        is_published: true,
        game_json: true,
        game_template: { select: { slug: true } },
      },
    });

    if (!game || game.game_template.slug !== this.WORDIT_SLUG) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    if (!game.is_published) {
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'This game is not published yet',
      );
    }

    return game;
  }
}
