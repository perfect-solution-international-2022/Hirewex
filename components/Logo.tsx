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
  const heights = { sm: 32, md: 40, lg: 56 };
  const h = heights[size];

  return (
    <Link href={href} className={`inline-flex items-center shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Logo_black.png"
        alt="Hirewex"
        className="object-contain dark:invert"
        style={{ height: h, width: "auto" }}
      />
    </Link>
  );
}