"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardBackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function DashboardBackButton({
  href = "/dashboard",
  label = "Back",
  className = "",
}: DashboardBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(href);
  };

  return (
    <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.98 }} className={className}>
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="rounded-2xl border border-white/30 bg-white/50 px-4 py-2 text-gray-700 shadow-md backdrop-blur-md transition-all hover:bg-white/70 hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:bg-gray-900/70"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </motion.div>
  );
}
