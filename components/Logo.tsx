"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Logo({
  className = "",
  size = "md",
  href = "/"
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const heights = { sm: 48, md: 56, lg: 72 };
  const h = heights[size];

  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };

  return (
    <Link href={href} className={`inline-flex items-center shrink-0 ${className}`}>
      {/* Light mode: text logo */}
      <span className={`block dark:hidden font-bold tracking-tight text-foreground ${textSizes[size]}`}>
        Hirewex
      </span>
      {/* Dark mode: image logo (white transparent) */}
      <Image
        src="/Logo_White.png"
        alt="Hirewex"
        width={h * 3}
        height={h}
        className="hidden dark:block object-contain"
        style={{ height: h, width: "auto" }}
        priority
      />
    </Link>
  );
}