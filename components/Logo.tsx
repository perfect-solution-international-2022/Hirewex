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
  const heights = { sm: 36, md: 44, lg: 60 };
  const h = heights[size];

  return (
    <Link href={href} className={`inline-flex items-center shrink-0 ${className}`}>
      {/* Light mode: black logo */}
      <Image
        src="/Logo_black.png"
        alt="Hirewex"
        width={h * 4}
        height={h}
        className="block dark:hidden object-contain"
        style={{ height: h, width: "auto" }}
        priority
      />
      {/* Dark mode: white logo */}
      <Image
        src="/Logo_white.png"
        alt="Hirewex"
        width={h * 4}
        height={h}
        className="hidden dark:block object-contain"
        style={{ height: h, width: "auto" }}
        priority
      />
    </Link>
  );
}