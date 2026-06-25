"use client";

import React, { useEffect, useRef } from "react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
  as?: React.ElementType;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
  as: Tag = "div",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const initialTransform =
      direction === "up"    ? "translateY(28px)" :
      direction === "left"  ? "translateX(-28px)" :
      direction === "right" ? "translateX(28px)"  : "none";

    el.style.opacity   = "0";
    el.style.transform = initialTransform;
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity   = "1";
          el.style.transform = "translate(0)";
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, direction]);

  return (
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}

export function StaggerChildren({
  children,
  stagger = 80,
  className = "",
}: {
  children: React.ReactNode[];
  stagger?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeIn key={i} delay={i * stagger}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
