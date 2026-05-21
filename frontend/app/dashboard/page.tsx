"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Upload,
  BookOpen,
  FileText,
  BrainCircuit,
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import AnimatedCounter from "@/components/AnimatedCounter";

interface RecentAttempt {
  id: number;
  quiz_id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string | null;
}

interface AnalyticsOverview {
  documents_count: number;
  quizzes_count: number;
  questions_count: number;
  average_score: number;
  recent_attempts: RecentAttempt[];
  performance_stats: {
    total_attempts: number;
    average_percentage: number;
    best_percentage: number;
    total_time_spent: number;
  };
}

const defaultStats: AnalyticsOverview = {
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AnalyticsOverview>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/analytics/overview");
      setStats({ ...defaultStats, ...res.data });
    } catch {
      setError("Unable to load analytics. Showing last known values.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const chartData = [...stats.recent_attempts]
    .reverse()
    .map((attempt, index) => ({
      name: `Attempt ${index + 1}`,
      score: attempt.percentage ?? 0,
    }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl"
      >
        <motion.div
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.full_name || "User"}
          </h1>
          <p className="mt-2 text-lg text-white/90">
            Your AI quiz studio — upload, generate, and track performance in one place.
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {error}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            title: "Documents",
            value: stats.documents_count,
            desc: "Uploaded files",
            icon: FileText,
            gradient: "from-blue-500/20 to-cyan-500/20",
            accent: "text-blue-600",
          },
          {
            title: "Questions",
            value: stats.questions_count,
            desc: "Generated MCQs",
            icon: BrainCircuit,
            gradient: "from-purple-500/20 to-fuchsia-500/20",
            accent: "text-purple-600",
          },
          {
            title: "Quizzes",
            value: stats.quizzes_count,
            desc: "Created quizzes",
            icon: Trophy,
            gradient: "from-emerald-500/20 to-teal-500/20",
            accent: "text-emerald-600",
          },
          {
            title: "Avg Score",
            value: stats.average_score,
            desc: "Across attempts",
            icon: Target,
            gradient: "from-orange-500/20 to-rose-500/20",
            accent: "text-orange-600",
            decimals: 1,
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className={`rounded-3xl border-0 bg-gradient-to-br ${item.gradient} shadow-xl backdrop-blur-xl transition-shadow hover:shadow-2xl`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                  <motion.div
                    whileHover={{ rotate: 8, scale: 1.05 }}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-lg dark:bg-gray-900/80"
                  >
                    <Icon className={`h-5 w-5 ${item.accent}`} />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${item.accent}`}>
                    {loading ? (
                      <Loader2 className="h-8 w-8 animate-spin opacity-60" />
                    ) : (
                      <AnimatedCounter
                        value={item.value}
                        decimals={item.decimals}
                      />
                    )}
                  </div>
                  <CardDescription className="mt-1">{item.desc}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <Card className="rounded-3xl border-0 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Performance Trend
            </CardTitle>
            <CardDescription>Recent quiz scores over time</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex h-full items-center justify-center text-gray-500"
              >
                Loading chart...
              </motion.div>
            ) : chartData.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 text-center dark:border-gray-700 dark:bg-gray-800/30"
              >
                <TrendingUp className="mb-3 h-10 w-10 text-gray-400" />
                <p className="font-medium text-gray-600 dark:text-gray-300">No attempts yet</p>
                <p className="mt-1 text-sm text-gray-500">Complete a quiz to see your performance chart.</p>
              </motion.div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="url(#scoreGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Leaderboard Stats</CardTitle>
            <CardDescription>Your personal bests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "Total Attempts",
                value: stats.performance_stats?.total_attempts ?? 0,
                icon: Trophy,
              },
              {
                label: "Best Score",
                value: stats.performance_stats?.best_percentage ?? 0,
                suffix: "%",
                icon: Target,
              },
              {
                label: "Avg Accuracy",
                value: stats.performance_stats?.average_percentage ?? 0,
                suffix: "%",
                icon: TrendingUp,
              },
              {
                label: "Time Practiced",
                value: formatTime(stats.performance_stats?.total_time_spent ?? 0),
                icon: Clock,
                raw: true,
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <motion.div
                  key={row.label}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:bg-gray-900/50"
                >
                  <motion.div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {row.label}
                    </span>
                  </motion.div>
                  <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {loading ? (
                      "—"
                    ) : row.raw ? (
                      row.value
                    ) : (
                      <>
                        <AnimatedCounter value={Number(row.value)} />
                        {row.suffix}
                      </>
                    )}
                  </span>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="rounded-3xl border-0 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-gray-900/60">
          <CardHeader>
            <CardTitle>Recent Quiz History</CardTitle>
            <CardDescription>Your latest completed attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading history...
              </div>
            ) : stats.recent_attempts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300">No quiz attempts yet</p>
                <Link href="/dashboard/upload">
                  <Button className="mt-4 rounded-xl">Create your first quiz</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_attempts.map((attempt, index) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <Link href={`/dashboard/result/${attempt.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/60 bg-white/50 p-4 transition-all hover:border-indigo-300 hover:shadow-lg dark:border-gray-700/60 dark:bg-gray-800/40 dark:hover:border-indigo-700"
                      >
                        <div>
                          <p className="font-semibold">{attempt.quiz_title || "Quiz"}</p>
                          <p className="text-sm text-gray-500">
                            {attempt.completed_at
                              ? new Date(attempt.completed_at).toLocaleString()
                              : "Recently completed"}
                          </p>
                        </div>
                        <motion.div className="flex items-center gap-4">
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {attempt.percentage}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {attempt.score}/{attempt.total_questions} correct
                          </span>
                        </motion.div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: "/dashboard/upload", icon: Upload, label: "Upload Files", colors: "from-blue-600 to-blue-700" },
            { href: "/dashboard/quizzes", icon: BookOpen, label: "My Quizzes", colors: "from-purple-600 to-purple-700" },
            { href: "/dashboard/analytics", icon: TrendingUp, label: "Analytics", colors: "from-emerald-600 to-emerald-700" },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <Button
                    className={`h-auto w-full flex-col gap-3 rounded-2xl border-0 bg-gradient-to-br ${action.colors} py-8 text-white shadow-xl`}
                  >
                    <Icon className="h-8 w-8" />
                    <span className="text-lg font-semibold">{action.label}</span>
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
