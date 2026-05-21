"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import DashboardBackButton from "@/components/DashboardBackButton";

interface Quiz {
  id: number;
  title: string;
  description?: string;
  created_at: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/quiz")
      .then((res) => setQuizzes(res.data))
      .catch(() => setError("Failed to load quizzes."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <DashboardBackButton />
      <div>
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">View quizzes created from your documents.</p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <motion.div className="grid gap-4">
        {loading ? (
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardContent className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading quizzes...
            </CardContent>
          </Card>
        ) : quizzes.length === 0 ? (
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardContent className="py-12 text-center text-gray-500">
              No quizzes yet. Upload and process a document first.
              <Link href="/dashboard/upload">
                <Button className="mt-4 rounded-xl">Upload document</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="rounded-3xl border-0 bg-white/70 shadow-xl backdrop-blur-xl transition-shadow hover:shadow-2xl dark:bg-gray-900/60">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      Created {new Date(quiz.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Link href={`/dashboard/quiz/${quiz.id}`}>
                    <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  </Link>
                </CardHeader>
                {quiz.description && <CardContent>{quiz.description}</CardContent>}
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
