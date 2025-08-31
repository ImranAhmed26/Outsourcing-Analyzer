"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <section className="relative  min-h-screen flex flex-col">
        <div className="container mx-auto px-4 pb-4 sm:pb-6 relative z-10 flex-1 flex flex-col">
          <div className="mx-auto max-w-4xl text-center flex-1 flex flex-col justify-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="relative inline-flex  overflow-hidden rounded-full p-px focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                  <Sparkles className="h-4 w-4 me-1" />
                  Powered by Advanced AI
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <h1
                id="main-title"
                className="text-4xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl "
              >
                Access{" "}
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                <strong>Business Leads</strong>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-4 max-w-2xl text-lg text-muted-foreground"
            >
              Better insights, better accuracy, more conversion.
            </motion.p>

            <motion.div className="relative w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-xl transition-all duration-300 ease-out   p-6  shadow-2xl shadow-black/20">
              <div className="relative">
                <textarea
                  placeholder="Find me all B2B SaaS leads (50-500 employees) in North America/Europe, interested in marketing automation, with active CMOs/VPs on LinkedIn (500+ connections), from Series A/B funded companies, excluding our CRM, with verified emails and revenue ($5M-$50M)."
                  className="w-full min-h-24 bg-transparent border-none outline-none resize-none transition-all duration-500 ease-out focus:ring-0 focus:outline-none placeholder:text-white/40 text-white/90 font-light text-base tracking-[-0.01em] overflow-hidden"
                ></textarea>
                <div className="flex items-center justify-end">
                  <a
                    href="/signup"
                    className="px-3 py-2 text-base font-bold text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground rounded-lg shadow-lg "
                  >
                    Search
                  </a>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-4 pb-8"
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-6">
                  Get Access to thousands of businesses using AI-powered lead
                  validation for better conversions
                </p>
              </div>
            </motion.div>
          </div>

          {/* Social Proof Section */}
        </div>
      </section>
    </>
  );
}
