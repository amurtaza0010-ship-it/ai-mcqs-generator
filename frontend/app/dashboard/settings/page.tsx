"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import DashboardBackButton from "@/components/DashboardBackButton";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <DashboardBackButton className="mb-4" />
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {user?.full_name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user?.email}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
