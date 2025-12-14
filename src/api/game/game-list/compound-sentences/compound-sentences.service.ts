import { type CompoundSentencesGame } from 'src/common/interface/games/compound-sentences.interface';

export abstract class CompoundSentencesService {
  // Slug for this game type (should match the slug in your gameTemplates table)
  private static compoundSentencesSlug = 'compound-sentences';

  // Return static game data (could be loaded from DB or file in the future)
  static getGameData(): CompoundSentencesGame {
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
        }
      ]
    };
  }

  // Used by the main game service to inject content for this game type
  static injectContentIfCompoundSentences(slug: string) {
    if (slug === this.compoundSentencesSlug) {
      return this.getGameData();
    }
    return null;
  }
}
