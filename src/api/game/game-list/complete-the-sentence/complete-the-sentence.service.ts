import { type CompleteTheSentenceGame } from 'src/common/interface/games/complete-the-sentence.interface';

export abstract class CompleteTheSentenceService {
  // Slug for this game type (should match the slug in your gameTemplates table)
  private static completeTheSentenceSlug = 'complete-the-sentence';

  // Return static game data (could be loaded from DB or file in the future)
  static getGameData(): CompleteTheSentenceGame {
    return {
      questions: [
        {
          leftClause: 'I wanted to go for a walk',
          rightClause: 'it was raining',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'I wanted to go for a walk, but it was raining.',
          explanation: "Use 'but' to show contrast."
        },
        {
          leftClause: 'She studied hard',
          rightClause: 'she passed the test',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'She studied hard, so she passed the test.',
          explanation: "Use 'so' to show result."
        },
        {
          leftClause: 'He can go to the party',
          rightClause: 'he finishes his homework',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'He can go to the party if he finishes his homework.',
          explanation: "Use 'if' to show condition."
        },
        {
          leftClause: 'The sun was shining',
          rightClause: 'it was cold outside',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'The sun was shining, but it was cold outside.',
          explanation: "Use 'but' to show contrast."
        },
        {
          leftClause: 'He didn’t study',
          rightClause: 'he failed the exam',
          availableConjunctions: ['and', 'but', 'so', 'or'],
          correctAnswer: 'He didn’t study, so he failed the exam.',
          explanation: "Use 'so' to show result."
        }
      ]
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
