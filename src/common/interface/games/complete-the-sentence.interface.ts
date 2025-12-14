export interface CompleteTheSentenceQuestion {
  leftClause: string;
  rightClause: string;
  availableConjunctions: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface CompleteTheSentenceGame {
  questions: CompleteTheSentenceQuestion[];
}
