'use client';

import { memo, useMemo } from 'react';

import { geist } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';
// import { useTheme } from 'next-themes';
import { useRef } from 'react';

// Memoized loading fallback
const EarthFallback = memo(() => <div className='bg-secondary/20 h-64 w-[400px] animate-pulse rounded-full' />);

EarthFallback.displayName = 'EarthFallback';

// Animation variants for better performance
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

// Constants to avoid recreating objects
// const DEFAULT_BASE_COLOR: [number, number, number] = [0.906, 0.541, 0.325];
// const DEFAULT_GLOW_COLOR: [number, number, number] = [0.906, 0.541, 0.325];

const Steps = memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  // const { theme } = useTheme();

  // const [baseColor, setBaseColor] =
  //   useState<[number, number, number]>(DEFAULT_BASE_COLOR);
  // const [glowColor, setGlowColor] =
  //   useState<[number, number, number]>(DEFAULT_GLOW_COLOR);

  // Memoized animation props
  const titleAnimation = useMemo(
    () => ({
      initial: 'hidden',
      animate: isInView ? 'visible' : 'hidden',
      variants: fadeInUpVariants,
      transition: { duration: 0.5, delay: 0 },
    }),
    [isInView]
  );

  const cardAnimation = useMemo(
    () => ({
      initial: 'hidden',
      animate: isInView ? 'visible' : 'hidden',
      variants: fadeInUpVariants,
      transition: { duration: 0.5, delay: 0.5 },
    }),
    [isInView]
  );

  // Memoized class names
  const titleClasses = useMemo(
    () =>
      cn(
        'via-foreground bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]',
        geist.className
      ),
    [] // geist.className is a static value, no need to include in dependencies
  );

  return (
    <section id='steps' className='text-foreground relative overflow-hidden py-12 sm:py-16 md:py-20'>
      <div className='bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none' />
      <div className='via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out' />

      <motion.div
        ref={ref}
        {...titleAnimation}
        className='container mx-auto max-w-6xl flex flex-col items-center gap-6 sm:gap-12'
      >
        <header className='text-center space-y-4'>
          <h2 className={titleClasses}>How It Works</h2>
          <p className='text-muted-foreground text-lg text-center max-w-2xl mx-auto'>
            Transform prospects into qualified leads with our intelligent 3-step validation process
          </p>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
          {/* Step 1 */}
          <motion.div
            className='group border-primary/40 text-card-foreground relative flex flex-col overflow-hidden rounded-xl border-2 p-8 shadow-xl transition-all ease-in-out backdrop-blur-sm bg-white/5 hover:bg-white/10'
            {...cardAnimation}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            <div className='z-10 space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center'>
                  <span className='text-primary font-bold text-lg'>1</span>
                </div>
                <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
                </div>
              </div>

              <div>
                <p className='text-primary/80 text-sm font-medium uppercase tracking-wider mb-2'>Step 1</p>
                <h3 className='text-2xl font-semibold text-white mb-3 leading-tight'>Define Your Target</h3>
                <p className='text-neutral-300 text-base leading-relaxed'>
                  Describe your ideal customer profile using natural language. Our AI understands complex criteria and filters
                  across industries, company sizes, and geographic regions.
                </p>
              </div>
            </div>

            <div className='absolute -bottom-2 -right-2 w-24 h-24 bg-primary/5 rounded-full blur-xl' />
          </motion.div>

          {/* Step 2 */}
          <motion.div
            className='group border-primary/40 text-card-foreground relative flex flex-col overflow-hidden rounded-xl border-2 p-8 shadow-xl transition-all ease-in-out backdrop-blur-sm bg-white/5 hover:bg-white/10'
            {...cardAnimation}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            <div className='z-10 space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center'>
                  <span className='text-primary font-bold text-lg'>2</span>
                </div>
                <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <div className='w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                </div>
              </div>

              <div>
                <p className='text-primary/80 text-sm font-medium uppercase tracking-wider mb-2'>Step 2</p>
                <h3 className='text-2xl font-semibold text-white mb-3 leading-tight'>AI-Powered Validation</h3>
                <p className='text-neutral-300 text-base leading-relaxed'>
                  Advanced algorithms scan 1000+ data sources, verify contact information, assess engagement likelihood, and score
                  each prospect&apos;s conversion probability in real-time.
                </p>
              </div>
            </div>

            <div className='absolute -bottom-2 -right-2 w-24 h-24 bg-primary/5 rounded-full blur-xl' />
          </motion.div>

          {/* Step 3 */}
          <motion.div
            className='group border-primary/40 text-card-foreground relative flex flex-col overflow-hidden rounded-xl border-2 p-8 shadow-xl transition-all ease-in-out backdrop-blur-sm bg-white/5 hover:bg-white/10'
            {...cardAnimation}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            <div className='z-10 space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center'>
                  <span className='text-primary font-bold text-lg'>3</span>
                </div>
                <div className='w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center'>
                  <div className='w-2 h-2 rounded-full bg-green-400' />
                </div>
              </div>

              <div>
                <p className='text-primary/80 text-sm font-medium uppercase tracking-wider mb-2'>Step 3</p>
                <h3 className='text-2xl font-semibold text-white mb-3 leading-tight'>Receive Qualified Leads</h3>
                <p className='text-neutral-300 text-base leading-relaxed'>
                  Get a curated list of verified prospects with complete contact details, behavioral insights, and personalized
                  outreach recommendations to maximize your conversion rates.
                </p>
              </div>
            </div>

            <div className='absolute -bottom-2 -right-2 w-24 h-24 bg-green-400/5 rounded-full blur-xl' />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
});

Steps.displayName = 'Steps';

export default Steps;
