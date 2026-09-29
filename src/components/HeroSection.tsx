import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onSeeHowItWorksClick: () => void;
  onSelectFeatureTag: (tag: string) => void;
}

const EASE_NEXORA = [0.16, 1, 0.3, 1] as const;

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onSeeHowItWorksClick,
  onSelectFeatureTag,
}) => {
  return (
    <section id="hero" className="radar-hero" aria-label="Nexora Hero">
      {/* Background Video */}
      <motion.div
        className="radar-video-backdrop"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.8,
          ease: EASE_NEXORA,
        }}
      >
        <video
          className="radar-video-element"
          autoPlay
          muted
          playsInline
          loop
          aria-hidden="true"
          poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23fafafc'></svg>"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
            type="video/mp4"
          />
        </video>
        <div className="radar-video-scrim" />
      </motion.div>

      {/* Spacer to push content to bottom while respecting full height */}
      <div style={{ flex: 1, minHeight: '80px' }} />

      {/* Hero Footer Content */}
      <motion.div
        className="radar-hero-footer"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.5,
          duration: 1,
          ease: EASE_NEXORA,
        }}
      >
        {/* Left Hero Content */}
        <div className="radar-hero-left">
          {/* Subtitle */}
          <motion.div
            className="radar-hero-subtitle"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 0.55 }}
            transition={{
              delay: 0.6,
              duration: 0.8,
              ease: EASE_NEXORA,
            }}
          >
            <span className="radar-subtitle-dot" aria-hidden="true" />
            <span>AI-POWERED COMPETITIVE INTELLIGENCE</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="radar-hero-heading"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.8,
              duration: 0.8,
              ease: EASE_NEXORA,
            }}
          >
            Know What Changed.
            <br />
            Know What To Say Next.
          </motion.h1>

          {/* Description */}
          <motion.p
            className="radar-hero-desc"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.9,
              duration: 0.8,
              ease: EASE_NEXORA,
            }}
          >
            Nexora monitors competitor websites, detects meaningful changes,
            and turns them into battlecards and sales-ready responses.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="radar-hero-cta-group"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 1.0,
              duration: 0.8,
              ease: EASE_NEXORA,
            }}
          >
            <button
              className="radar-btn-primary"
              onClick={onExploreClick}
              type="button"
            >
              <span>Explore Nexora</span>
              <ArrowRight size={14} />
            </button>

            <button
              className="radar-btn-secondary"
              onClick={onSeeHowItWorksClick}
              type="button"
            >
              <span>See How It Works</span>
              <ChevronDown size={14} />
            </button>
          </motion.div>
        </div>

        {/* Right Hero Tags */}
        <motion.div
          className="radar-hero-right"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 1.1,
            duration: 0.8,
            ease: EASE_NEXORA,
          }}
          aria-label="Core Capabilities"
        >
          <button
            className="radar-hero-tag-pill"
            onClick={() => onSelectFeatureTag('monitoring')}
            type="button"
            title="Click to inspect Live Monitoring"
          >
            <span className="radar-tag-bullet" aria-hidden="true" />
            <span>Live Monitoring</span>
          </button>

          <button
            className="radar-hero-tag-pill"
            onClick={() => onSelectFeatureTag('battlecards')}
            type="button"
            title="Click to inspect AI Battlecards"
          >
            <span className="radar-tag-bullet" aria-hidden="true" />
            <span>AI Battlecards</span>
          </button>

          <button
            className="radar-hero-tag-pill"
            onClick={() => onSelectFeatureTag('counterpitch')}
            type="button"
            title="Click to inspect Counter-Pitch Generator"
          >
            <span className="radar-tag-bullet" aria-hidden="true" />
            <span>Counter-Pitch</span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};
