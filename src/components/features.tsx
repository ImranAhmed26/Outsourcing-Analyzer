"use client";

import { memo, useMemo } from "react";

import { geist } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Suspense, useRef, useState } from "react";
import { BackgroundRippleEffect } from "./ui/bg-ripple-effect";
import Earth from "./ui/globe";

// Memoized loading fallback
const EarthFallback = memo(() => (
  <div className="bg-secondary/20 h-64 w-[400px] animate-pulse rounded-full" />
));

EarthFallback.displayName = "EarthFallback";

// Animation variants for better performance
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

// Constants to avoid recreating objects
const DEFAULT_BASE_COLOR: [number, number, number] = [0.906, 0.541, 0.325];
const DEFAULT_GLOW_COLOR: [number, number, number] = [0.906, 0.541, 0.325];

const Features = memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const { theme } = useTheme();

  const [baseColor, setBaseColor] =
    useState<[number, number, number]>(DEFAULT_BASE_COLOR);
  const [glowColor, setGlowColor] =
    useState<[number, number, number]>(DEFAULT_GLOW_COLOR);

  // Memoized animation props
  const titleAnimation = useMemo(
    () => ({
      initial: "hidden",
      animate: isInView ? "visible" : "hidden",
      variants: fadeInUpVariants,
      transition: { duration: 0.5, delay: 0 },
    }),
    [isInView]
  );

  const cardAnimation = useMemo(
    () => ({
      initial: "hidden",
      animate: isInView ? "visible" : "hidden",
      variants: fadeInUpVariants,
      transition: { duration: 0.5, delay: 0.5 },
    }),
    [isInView]
  );

  // Memoized class names
  const titleClasses = useMemo(
    () =>
      cn(
        "via-foreground bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
        geist.className
      ),
    [geist.className]
  );

  return (
    <section
      id="features"
      className="text-foreground relative overflow-hidden py-12 sm:py-16 md:py-20"
    >
      <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none" />
      <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out" />

      <motion.div
        ref={ref}
        {...titleAnimation}
        className="container mx-auto max-w-5xl flex flex-col items-center gap-6 sm:gap-12"
      >
        <header>
          <h2 className={titleClasses}>Features</h2>
          <p className="text-muted-foreground text-lg text-center max-w-2xl">
            Powerful tools to streamline your workflow
          </p>
        </header>

        <div className="grid grid-cols-12 gap-4 justify-center">
          {/* CLI Feature Card */}
          <motion.div
            className="group border-primary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl bg-[#222]/50 border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-7 xl:col-span-7 xl:col-start-1"
            {...cardAnimation}
            style={{ transition: "all 0s ease-in-out" }}
          >
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl leading-none font-semibold tracking-tight">
                Everything At Once
              </h3>
              <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                <p className="max-w-[460px]">
                  Gather leads and access rich data effortlessly with AI
                  integration across 1000+ sources, all in one streamlined
                  platform.
                </p>
              </div>
            </div>

            <div className="pointer-events-none flex grow items-center justify-center select-none relative">
              <div
                className="relative w-full h-64 rounded-xl overflow-hidden"
                style={{ borderRadius: "20px" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-8">
                    <Image
                      src="/flow.svg"
                      alt="flow"
                      fill
                      className="z-10 mix-blend-screen"
                      priority
                    />
                    <BackgroundRippleEffect />
                  </div>

                  <div className="absolute top-1/2 w-full translate-y-20 scale-x-[1.2] opacity-70 transition-all duration-1000">
                    <div className="from-primary/30 to-primary/0 absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[512px] dark:opacity-100" />
                    <div className="from-primary/10 to-primary/0 absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[256px] dark:opacity-100" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Global Market Access Card */}
          <motion.div
            className="group border-primary/40 bg-[#222]/50 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
            {...cardAnimation}
            style={{ transition: "all 0s ease-in-out" }}
          >
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl leading-none font-semibold tracking-tight">
                Global Market Access
              </h3>
              <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                <p className="max-w-[460px]">
                  Access all global markets in one window with AI-powered tools,
                  connecting you to business opportunities and lead data across
                  every region.
                </p>
              </div>
            </div>

            <div className="flex min-h-56 grow items-start justify-center select-none">
              <div className="absolute -right-14 z-10 flex items-center justify-center">
                <div className="w-[400px] h-64">
                  <Suspense fallback={<EarthFallback />}>
                    <Earth
                      glowColor={glowColor}
                      baseColor={baseColor}
                      dark={1}
                    />
                  </Suspense>
                </div>
              </div>

              <div className="absolute top-1/2 w-full translate-y-20 scale-x-[1.2] opacity-70 transition-all duration-1000 group-hover:translate-y-8 group-hover:opacity-100">
                <div className="from-primary/20 to-primary/0 absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[512px] dark:opacity-100" />
                <div className="from-primary/10 to-primary/0 absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[256px] dark:opacity-100" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
});

Features.displayName = "Features";

export default Features;
