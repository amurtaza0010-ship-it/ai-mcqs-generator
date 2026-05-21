"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  BrainCircuit,
  Trophy,
  Target,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import DashboardBackButton from "@/components/DashboardBackButton";
import AnimatedCounter from "@/components/AnimatedCounter";

interface AnalyticsOverview {
  documents_count: number;
  quizzes_count: number;
  questions_count: number;
  average_score: number;
  recent_attempts: Array<{
    id: number;
    quiz_title: string;
    percentage: number;
    score: number;
    total_questions: number;
    completed_at: string | null;
  }>;
  performance_stats: {
    total_attempts: number;
    average_percentage: number;
    best_percentage: number;
    total_time_spent: number;
  };
}

const emptyData: AnalyticsOverview = {
  documents_count: 0,
  quizzes_count: 0,
  questions_count: 0,
  average_score: 0,
  recent_attempts: [],
  performance_stats: {
    total_attempts: 0,
    average_percentage: 0,
    best_percentage: 0,
    total_time_spent: 0,
  },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/analytics/overview")
      .then((res) => setData({ ...emptyData, ...res.data }))
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  const stats = data ?? emptyData;
  const chartData = stats.recent_attempts.map((attempt, index) => ({
    name: attempt.quiz_title?.slice(0, 12) || `Q${index + 1}`,
    score: attempt.percentage ?? 0,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <DashboardBackButton />
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Track your learning activity and quiz performance.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Documents", value: stats.documents_count, icon: FileText, color: "blue" },
          { title: "Questions", value: stats.questions_count, icon: BrainCircuit, color: "purple" },
          { title: "Quizzes", value: stats.quizzes_count, icon: Trophy, color: "emerald" },
          { title: "Average Score", value: stats.average_score, icon: Target, color: "orange", decimals: 1 },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="rounded-3xl border-0 bg-white/70 shadow-xl backdrop-blur-xl dark:bg-gray-900/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <Icon className={`h-5 w-5 text-${item.color}-600`} />
                </CardHeader>
                <CardContent className="text-4xl font-bold">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                  ) : (
                    <AnimatedCounter value={item.value} decimals={item.decimals} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Score Distribution
            </CardTitle>
            <CardDescription>Performance across recent attempts</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex h-full items-center justify-center text-gray-500"
              >
                Loading chart...
              </motion.div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 text-center dark:border-gray-700">
                <TrendingUp className="mb-3 h-10 w-10 text-gray-400" />
                <p className="font-medium">No performance data yet</p>
                <Link href="/dashboard/upload">
                  <Button variant="outline" className="mt-4 rounded-xl">
                    Start a quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Total Attempts", value: stats.performance_stats.total_attempts },
              { label: "Average Accuracy", value: stats.performance_stats.average_percentage, suffix: "%" },
              { label: "Best Score", value: stats.performance_stats.best_percentage, suffix: "%" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl bg-white/60 p-4 dark:bg-gray-900/50"
              >
                <span className="text-gray-600 dark:text-gray-300">{row.label}</span>
                <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {loading ? "—" : (
                    <>
                      <AnimatedCounter value={row.value} />
                      {row.suffix}
                    </>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
