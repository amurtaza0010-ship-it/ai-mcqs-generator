import { create } from 'zustand';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  question_type: string;
  topic: string;
}

interface QuizState {
  currentQuestion: number;
  selectedAnswers: Record<number, string>;
  timeRemaining: number;
  isPaused: boolean;
  quizStarted: boolean;
  quizCompleted: boolean;
  questions: Question[];
  setCurrentQuestion: (index: number) => void;
  setSelectedAnswer: (questionId: number, answer: string) => void;
  setTimeRemaining: (time: number) => void;
  setPaused: (paused: boolean) => void;
  setQuizStarted: (started: boolean) => void;
  setQuizCompleted: (completed: boolean) => void;
  setQuestions: (questions: Question[]) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuestion: 0,
  selectedAnswers: {},
  timeRemaining: 0,
  isPaused: false,
  quizStarted: false,
  quizCompleted: false,
  questions: [],
  setCurrentQuestion: (index) => set({ currentQuestion: index }),
  setSelectedAnswer: (questionId, answer) =>
    set((state) => ({
      selectedAnswers: { ...state.selectedAnswers, [questionId]: answer },
    })),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setPaused: (paused) => set({ isPaused: paused }),
  setQuizStarted: (started) => set({ quizStarted: started }),
  setQuizCompleted: (completed) => set({ quizCompleted: completed }),
  setQuestions: (questions) => set({ questions }),
  resetQuiz: () =>
    set({
      currentQuestion: 0,
      selectedAnswers: {},
      timeRemaining: 0,
      isPaused: false,
      quizStarted: false,
      quizCompleted: false,
      questions: [],
    }),
}));
