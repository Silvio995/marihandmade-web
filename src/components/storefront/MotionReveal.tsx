"use client";

import { Children, type ReactNode } from "react";
import { LazyMotion, m, useReducedMotion } from "framer-motion";

const loadFeatures = () =>
  import("./motion-features").then((module) => module.default);

// Server-rendered children stay visible before hydration / without JavaScript.
// One viewport observer per group; children share its stagger timeline.
export function MotionReveal({
  children,
  className,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const reduced = useReducedMotion();
  const reveal = {
    visible: {
      opacity: reduced ? 1 : [0, 1],
      y: reduced ? 0 : [12, 0],
      transition: {
        duration: reduced ? 0 : 0.75,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.div
        className={`shop-reveal ${className ?? ""}`}
        initial={false}
        whileInView={
          typeof IntersectionObserver !== "undefined" && !reduced
            ? "visible"
            : undefined
        }
        viewport={{ once: true, amount: 0.12 }}
        variants={
          stagger
            ? {
                visible: {
                  transition: { staggerChildren: reduced ? 0 : 0.09 },
                },
              }
            : reveal
        }
      >
        {stagger
          ? Children.map(children, (child) => (
              <m.div className="shop-reveal min-w-0" variants={reveal}>
                {child}
              </m.div>
            ))
          : children}
      </m.div>
    </LazyMotion>
  );
}
