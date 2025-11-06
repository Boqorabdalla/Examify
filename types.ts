
export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  MATCHING = 'MATCHING',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
}

export interface MCQQuestion extends BaseQuestion {
  type: QuestionType.MCQ;
  options: string[];
  answer: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: QuestionType.TRUE_FALSE;
  answer: boolean;
}

export interface MatchingItem {
  id: string;
  premise: string;
  response: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: QuestionType.MATCHING;
  premises: string[];
  responses: string[];
  answers: { premise: string; response: string }[];
}


export interface ShortAnswerQuestion extends BaseQuestion {
  type: QuestionType.SHORT_ANSWER;
  answer: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: QuestionType.ESSAY;
  answer: string; // Suggested answer or key points
}

export type Question = MCQQuestion | TrueFalseQuestion | MatchingQuestion | ShortAnswerQuestion | EssayQuestion;

export interface Exam {
  id: string; // Unique ID for the exam instance
  institutionId: string; // Link to the institution
  creatorId: string; // User ID of the exam creator
  creatorUsername: string; // Username of the exam creator
  courseName: string;
  examType: string;
  duration?: number;
  questions: Question[];
}

export interface QuestionDistribution {
  [QuestionType.MCQ]: number;
  [QuestionType.TRUE_FALSE]: number;
  [QuestionType.MATCHING]: number;
  [QuestionType.SHORT_ANSWER]: number;
  [QuestionType.ESSAY]: number;
}

export interface ExamParameters {
  examType: string;
  courseName: string;
  duration?: number;
  difficulty: string;
  questionDistribution: QuestionDistribution;
}

// --- User Management & Multi-Tenancy Types ---

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TEACHER = 'TEACHER',
}

export enum InstitutionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be a hash
  role: UserRole;
  institutionId?: string; // Links user to an institution
}

export interface Institution {
  id: string;
  name: string;
  logo?: string; // Optional branding
  status: InstitutionStatus;
  type?: string;
  staffName?: string;
  phone?: string;
  location?: string;
}

// --- New Platform-level Types ---

export interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: string; // ISO date string
    institutionIds?: string[]; // Target specific institutions. If undefined, it's global.
}