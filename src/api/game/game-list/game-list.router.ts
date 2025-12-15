import { Router } from 'express';

import { AnagramController } from './anagram/anagram.controller';
import { CompleteTheSentenceController } from './complete-the-sentence';
import { MazeChaseController } from './maze-chase/maze-chase.controller';
import { PairOrNoPairController } from './pair-or-no-pair/pair-or-no-pair.controller';
import { QuizController } from './quiz/quiz.controller';
import { SpeedSortingController } from './speed-sorting/speed-sorting.controller';
import { TypeSpeedController } from './type-speed/type-speed.controller';

const gameListRouter = Router();

gameListRouter.use('/quiz', QuizController);
gameListRouter.use('/maze-chase', MazeChaseController);
gameListRouter.use('/speed-sorting', SpeedSortingController);
gameListRouter.use('/anagram', AnagramController);
gameListRouter.use('/pair-or-no-pair', PairOrNoPairController);
gameListRouter.use('/type-speed', TypeSpeedController);
gameListRouter.use('/complete-the-sentence', CompleteTheSentenceController);

export { gameListRouter };
