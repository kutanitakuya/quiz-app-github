export interface QuizQuestion {
    question: string;
    choices: string[];
    timestamp: Date;
    duration: number; // 秒
  }
  
  export interface QuizAnswer {
    choiceIndex: number;
    answeredAt: Date;
  }