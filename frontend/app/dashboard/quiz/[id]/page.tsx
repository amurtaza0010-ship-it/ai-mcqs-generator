"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import api from "@/lib/axios";
import DashboardBackButton from "@/components/DashboardBackButton";

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface QuizData {
  quiz_id: number;
  title: string;
  time_limit_minutes: number;
  question_count: number;
  questions: Question[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Fetch quiz data on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.post(`/quiz/${quizId}/start`);
        setQuizData(response.data);
        setTimeLeft(response.data.time_limit_minutes * 60);
        setStartTime(new Date());
        setLoading(false);
      } catch (err: unknown) {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "Failed to load quiz";
        setError(detail);
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Countdown timer
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        if (prev <= 60) {
          setShowTimeoutWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!quizData || !startTime || submitting) return;

    setSubmitting(true);
    const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    try {
      const submissionAnswers: Record<number, string> = {};
      quizData.questions.forEach((question) => {
        submissionAnswers[question.id] = answers[question.id] || "";
      });

      const response = await api.post(`/quiz/${quizId}/submit`, {
        answers: submissionAnswers,
        time_taken_seconds: timeTaken,
      });

      router.push(`/dashboard/result/${response.data.attempt_id}`);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to submit quiz";
      setError(detail);
      setSubmitting(false);
    }
  }, [quizData, startTime, answers, submitting, quizId, router]);

  const progress = quizData
    ? ((currentQuestionIndex + 1) / quizData.questions.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0 bg-red-50/50 dark:bg-red-950/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Quiz not found"}</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
    >
      {/* Header with Timer */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <DashboardBackButton label="Exit Quiz" className="mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{quizData.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {quizData.questions.length}
              </p>
            </div>
            <motion.div
              animate={timeLeft <= 60 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: timeLeft <= 60 ? Infinity : 0, duration: 1 }}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-lg font-bold shadow-lg backdrop-blur-sm ${
                timeLeft <= 60
                  ? "bg-red-500/15 text-red-600 ring-2 ring-red-400/50 dark:text-red-400"
                  : "bg-indigo-500/15 text-indigo-700 ring-2 ring-indigo-400/30 dark:text-indigo-300"
              }`}
            >
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </motion.div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl leading-relaxed">
                  {currentQuestion.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {["a", "b", "c", "d"].map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(currentQuestion.id, option.toUpperCase())}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                      currentAnswer === option.toUpperCase()
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          currentAnswer === option.toUpperCase()
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {option.toUpperCase()}
                      </div>
                      <span className="flex-1 text-lg">
                        {currentQuestion[`option_${option}` as keyof Question] as string}
                      </span>
                      {currentAnswer === option.toUpperCase() && (
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            size="lg"
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex === quizData.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Question navigation pills */}
        <motion.div className="mt-8 flex flex-wrap justify-center gap-2">
          {quizData.questions.map((q, index) => (
            <motion.button
              key={q.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`min-w-[2.5rem] rounded-full px-3 py-2 text-sm font-bold transition-all ${
                currentQuestionIndex === index
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : answers[q.id]
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-white/70 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800/70 dark:text-gray-300 dark:ring-gray-700"
              }`}
            >
              {index + 1}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Timeout Warning Modal */}
      <AnimatePresence>
        {showTimeoutWarning && timeLeft > 0 && timeLeft <= 60 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <Card className="max-w-md w-full shadow-2xl border-0 bg-red-50/90 dark:bg-red-950/90 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600 animate-pulse" />
                <h2 className="text-2xl font-bold mb-2">Time Running Out!</h2>
                <p className="text-lg mb-4">You have {formatTime(timeLeft)} remaining.</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please submit your answers soon or they will be auto-submitted.
                </p>
                <Button
                  onClick={() => setShowTimeoutWarning(false)}
                  className="mt-6 w-full"
                  variant="outline"
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
