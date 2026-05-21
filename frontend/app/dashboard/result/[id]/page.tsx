"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Target,
  BookOpen,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import api from "@/lib/axios";
import DashboardBackButton from "@/components/DashboardBackButton";

interface QuestionReview {
  question_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  selected_answer: string | null;
  is_correct: boolean;
  explanation: string | null;
}

interface QuizResult {
  attempt_id: number;
  quiz_id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  started_at: string;
  completed_at: string;
  questions: QuestionReview[];
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/quiz/attempts/${attemptId}`);
        setResult(response.data);
        setLoading(false);
      } catch (err: unknown) {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "Failed to load result";
        setError(detail);
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "from-green-500 to-emerald-500";
    if (percentage >= 60) return "from-blue-500 to-cyan-500";
    if (percentage >= 40) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Average";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0 bg-red-50/50 dark:bg-red-950/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Result not found"}</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSkipped = (answer: string | null | undefined) => !answer?.trim();

  const correctCount = result.questions.filter((q) => q.is_correct).length;
  const wrongCount = result.questions.filter(
    (q) => !q.is_correct && !isSkipped(q.selected_answer)
  ).length;
  const skippedCount = result.questions.filter((q) => isSkipped(q.selected_answer)).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <DashboardBackButton label="Back" className="mb-4" />
          <h1 className="text-4xl font-bold mb-2">{result.quiz_title}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Completed on {new Date(result.completed_at).toLocaleDateString()}
          </p>
        </div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-800/80 dark:to-gray-800/50 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Main Score */}
                <div className="md:col-span-2 text-center">
                  <div
                    className={`w-48 h-48 mx-auto rounded-full bg-gradient-to-br ${getScoreColor(
                      result.percentage
                    )} flex items-center justify-center shadow-2xl`}
                  >
                    <div className="text-white">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-5xl font-bold"
                      >
                        {result.percentage}%
                      </motion.div>
                      <div className="text-lg opacity-90">{result.score}/{result.total_questions}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {getScoreLabel(result.percentage)}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50/50 dark:bg-green-950/30 backdrop-blur-sm">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {correctCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50/50 dark:bg-red-950/30 backdrop-blur-sm">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {wrongCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Wrong Answers</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm">
                    <Target className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {skippedCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Skipped Questions</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 backdrop-blur-sm">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {formatTime(result.time_taken_seconds)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Time Taken</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-2xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Question Review
              </CardTitle>
              <CardDescription>
                Review your answers and learn from explanations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.questions.map((question, index) => (
                <motion.div
                  key={question.question_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`p-6 rounded-2xl border-2 ${
                    question.is_correct
                      ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
                      : isSkipped(question.selected_answer)
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30"
                      : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
                  } backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        question.is_correct
                          ? "bg-green-600 text-white"
                          : isSkipped(question.selected_answer)
                          ? "bg-amber-500 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold mb-2">{question.question_text}</p>
                      <div className="grid gap-2">
                        {["a", "b", "c", "d"].map((option) => {
                          const optionText = question[`option_${option}` as keyof QuestionReview] as string;
                          const isCorrect = question.correct_answer === option.toUpperCase();
                          const isSelected = question.selected_answer === option.toUpperCase();

                          return (
                            <div
                              key={option}
                              className={`p-3 rounded-lg border transition-all ${
                                isCorrect
                                  ? "border-green-500 bg-green-100 dark:bg-green-900/50 font-medium"
                                  : isSelected && !isCorrect
                                  ? "border-red-500 bg-red-100 dark:bg-red-900/50"
                                  : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{option.toUpperCase()}.</span>
                                <span>{optionText}</span>
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                                {isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {question.explanation && (
                    <div className="mt-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}

                  {isSkipped(question.selected_answer) && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <span>Question skipped by user</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            onClick={() => router.push("/dashboard/upload")}
            variant="outline"
            size="lg"
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Take Another Quiz
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="lg"
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
