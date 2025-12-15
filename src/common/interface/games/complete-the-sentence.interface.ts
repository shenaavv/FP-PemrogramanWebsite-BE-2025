export interface ICompleteTheSentenceQuestion {
  leftClause: string;
  rightClause: string;
  availableConjunctions: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ICompleteTheSentenceGame {
  questions: ICompleteTheSentenceQuestion[];
}
