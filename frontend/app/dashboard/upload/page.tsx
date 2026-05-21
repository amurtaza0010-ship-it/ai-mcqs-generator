"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Loader2,
  Upload,
  CheckCircle2,
  BrainCircuit,
  Clock,
  Target,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import api from "@/lib/axios";
import DashboardBackButton from "@/components/DashboardBackButton";

interface UploadedDocument {
  id: number;
  original_filename: string;
  status: string;
}

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty?: string;
  topic?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [document, setDocument] = useState<UploadedDocument | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Quiz configuration
  const [quizTitle, setQuizTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [generateCount, setGenerateCount] = useState(20);
  const [questionCount, setQuestionCount] = useState(10);
  const [timerDuration, setTimerDuration] = useState(30);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);

      setDocument(null);
      setQuestions([]);

      setMessage("");
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setDocument(response.data);

      setMessage(
        "File uploaded successfully. You can now process the document."
      );
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Upload failed.";

      setError(typeof detail === "string" ? detail : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!document) return;

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      const count = Math.min(Math.max(generateCount, 1), 50);
      const response = await api.post(
        `/document/process/${document.id}`,
        null,
        { params: { question_count: count } }
      );

      setDocument({
        ...document,
        status: response.data.status || "processed",
      });

      const generatedTotal =
        response.data.questions_generated ??
        response.data.questions_requested ??
        count;

      setMessage(
        response.data.message ||
          `Generated ${generatedTotal} questions successfully.`
      );

      const questionsResponse = await api.get("/questions", {
        params: { document_id: document.id },
      });

      const generatedQuestions = questionsResponse.data || [];
      setQuestions(generatedQuestions);
      const available = generatedQuestions.length;
      setQuestionCount(Math.min(Math.max(generateCount, 1), available || generatedTotal));
      
      setQuizTitle(document.original_filename.replace(/\.[^/.]+$/, "") + " Quiz");
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Processing failed.";

      setError(typeof detail === "string" ? detail : "Processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!document || !quizTitle) return;

    setCreatingQuiz(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/quiz", {
        title: quizTitle,
        description: `Quiz generated from ${document.original_filename}`,
        document_id: document.id,
        time_limit_minutes: timerDuration,
        difficulty: difficulty,
        question_count: questionCount,
      });

      setMessage("Quiz created successfully! Redirecting...");
      
      // Navigate to quiz page
      setTimeout(() => {
        router.push(`/dashboard/quiz/${response.data.id}`);
      }, 1000);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Quiz creation failed.";

      setError(typeof detail === "string" ? detail : "Quiz creation failed.");
    } finally {
      setCreatingQuiz(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <DashboardBackButton />

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          AI MCQ Generator
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
          Upload PDF, DOCX, or TXT files and instantly generate
          AI-powered multiple-choice questions.
        </p>
      </div>

      {/* Upload Card */}
      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl">
            Document Upload
          </CardTitle>

          <CardDescription>
            Drag & drop your document or click to browse
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-400"
            }`}
          >
            <input {...getInputProps()} />

            <Upload className="w-14 h-14 mx-auto mb-4 text-blue-600" />

            {file ? (
              <div className="flex items-center justify-center gap-3 text-lg font-medium">
                <FileText className="w-6 h-6" />
                {file.name}
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Drop the file here..."
                    : "Upload your document"}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOCX, TXT • Max 10MB
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload File"
              )}
            </Button>

            {document && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full space-y-2 rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20"
              >
                <Label htmlFor="generate-count" className="text-sm font-semibold">
                  Questions to generate from document
                </Label>
                <input
                  id="generate-count"
                  type="number"
                  min={1}
                  max={50}
                  value={generateCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 1;
                    setGenerateCount(Math.min(Math.max(value, 1), 50));
                  }}
                  className="w-full max-w-xs rounded-xl border border-gray-300 bg-white/70 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800/70"
                />
                <p className="text-xs text-gray-500">
                  Generate up to 50 MCQs so you can run quizzes with 10, 15, or 20 questions.
                </p>
              </motion.div>
            )}

            <Button
              variant="secondary"
              onClick={handleProcess}
              disabled={!document || processing}
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating MCQs...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Process Document
                </>
              )}
            </Button>
          </div>

          {/* Status */}
          {document && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-600" />

              Uploaded:
              <span className="font-medium">
                {document.original_filename}
              </span>

              ({document.status})
            </div>
          )}

          {message && (
            <div className="p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Configuration Panel */}
      {questions.length > 0 && (
        <div className="w-full flex justify-center items-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-3xl mx-auto"
          >
          <Card className="w-full mx-auto shadow-2xl border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl rounded-3xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                <Target className="w-8 h-8 text-blue-600" />
                Quiz Configuration
              </CardTitle>
              <CardDescription className="text-base">
                Customize your quiz settings before starting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              {/* Quiz Title */}
              <div className="space-y-2">
                <Label htmlFor="quiz-title" className="text-base font-semibold">
                  Quiz Title
                </Label>
                <input
                  id="quiz-title"
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter quiz title..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Difficulty Level
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="all">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Count Input */}
              <div className="space-y-2">
                <Label htmlFor="question-count" className="text-base font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Number of Questions
                </Label>
                <input
                  id="question-count"
                  type="number"
                  min={1}
                  max={questions.length}
                  value={questionCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setQuestionCount(Math.min(Math.max(value, 1), questions.length));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter how many MCQs you want in the quiz (max {questions.length} available)
                </p>
              </div>

              {/* Timer Duration Selector */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timer Duration
                </Label>
                <Select value={timerDuration.toString()} onValueChange={(value) => setTimerDuration(parseInt(value))}>
                  <SelectTrigger className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl">
                    <SelectValue placeholder="Select timer duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Create Quiz Button */}
              <Button
                onClick={handleCreateQuiz}
                disabled={!quizTitle || creatingQuiz}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl rounded-xl text-lg py-6"
              >
                {creatingQuiz ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Quiz...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-5 h-5 mr-2" />
                    Start Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}