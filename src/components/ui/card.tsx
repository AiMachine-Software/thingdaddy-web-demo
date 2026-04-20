import React from "react";
import { cn } from "../../lib/utils";
import { motion, type HTMLMotionProps,  } from "motion/react";

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const variants = {
    default: "bg-white border border-gray-100 shadow-sm rounded-[2rem]",
    outline: "bg-transparent border border-gray-200 rounded-[2rem]",
    ghost: "bg-gray-50/50 border-transparent rounded-[2rem]",
  };

  return (
    <motion.div
      className={cn("p-8 transition-all duration-300", variants[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
