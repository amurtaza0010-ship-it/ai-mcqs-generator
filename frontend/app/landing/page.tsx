"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Brain, Zap, TrendingUp, Shield, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI MCQ Generator
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4"
        >
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">Get Started</Button>
          </Link>
        </motion.div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Transform Documents into Interactive Quizzes
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload your PDF, DOCX, or TXT files and let our AI generate high-quality multiple-choice questions instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section id="features" className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Everything you need to create engaging quizzes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: <Brain className="w-8 h-8" />,
              title: "AI-Powered Generation",
              description: "Advanced AI analyzes your content and generates relevant, high-quality questions.",
            },
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Instant Results",
              description: "Generate quizzes in seconds, not hours. Save time and focus on what matters.",
            },
            {
              icon: <BookOpen className="w-8 h-8" />,
              title: "Multiple File Formats",
              description: "Support for PDF, DOCX, and TXT files. Upload any document and get started.",
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: "Detailed Analytics",
              description: "Track performance, identify weak areas, and improve learning outcomes.",
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "Secure & Private",
              description: "Your data is encrypted and secure. We prioritize your privacy.",
            },
            {
              icon: <Clock className="w-8 h-8" />,
              title: "Timed Quizzes",
              description: "Create timed quizzes with countdown timers for exam-like experiences.",
            },
          ].map((feature, index) => (
            <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-blue-600 mb-2"
                >
                  {feature.icon}
                </motion.div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of educators and students using AI MCQ Generator
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2024 AI MCQ Generator. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}
