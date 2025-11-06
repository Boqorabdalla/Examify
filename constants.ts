
import { QuestionType } from './types';

export const EXAM_TYPES = ['Quiz', 'Mid-term', 'Final Exam', 'Practice Test'];
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Mixed'];

export const QUESTION_TYPE_LABELS: { [key in QuestionType]: string } = {
  [QuestionType.MCQ]: 'Multiple Choice',
  [QuestionType.TRUE_FALSE]: 'True/False',
  [QuestionType.MATCHING]: 'Matching',
  [QuestionType.SHORT_ANSWER]: 'Short Answer',
  [QuestionType.ESSAY]: 'Essay',
};
