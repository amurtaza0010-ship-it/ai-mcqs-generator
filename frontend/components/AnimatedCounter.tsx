"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const spring = useSpring(0, { stiffness: 75, damping: 18 });
  const display = useTransform(spring, (current) =>
    decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString()
  );
  const [text, setText] = useState("0");

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (latest) => setText(latest));
  }, [display]);

  return (
    <motion.span className={className}>
      {text}
      {suffix}
    </motion.span>
  );
}
