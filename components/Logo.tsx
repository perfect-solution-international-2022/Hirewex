"use client";

import React from "react";
import Link from "next/link";

export function Logo({ 
  className = "", 
  size = "md", 
  href = "/" 
}: { 
  className?: string; 
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
  
  return (
    <Link href={href} className={`font-bold tracking-tight text-primary ${sizes[size]} ${className}`}>
      Hirewex
    </Link>
  );
}