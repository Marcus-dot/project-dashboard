'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DashlyLoader from '@/components/DashlyLoader'
import { ArrowRight, BarChart3, Target, Zap } from 'lucide-react'

export default function HomePage() {
  const [showLoader, setShowLoader] = useState(true)
  const [logoAnimated, setLogoAnimated] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [showFeatures, setShowFeatures] = useState(false)
  const [showButton, setShowButton] = useState(false)

  const fullText = "something something, we need a tag line or some thing. Something something...."

  // Handle loader complete
  const handleLoaderComplete = () => {
    setShowLoader(false)
    // Start logo animation after a brief delay
    setTimeout(() => {
      setLogoAnimated(true)
      // Start typing effect after logo finishes animating
      setTimeout(() => {
        startTypingEffect()
      }, 1200) // Wait for logo animation to complete (1.2s)
    }, 200)
  }

  // Typing effect
  const startTypingEffect = () => {
    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        // Show features after typing completes
        setTimeout(() => setShowFeatures(true), 300)
        // Show button after features
        setTimeout(() => setShowButton(true), 800)
      }
    }, 50) // 50ms per character for smooth typing
  }

  if (showLoader) {
    return <DashlyLoader onComplete={handleLoaderComplete} />
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FBFEF9, #F5F0F6)'
      }}
    >
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
        <div className="particle particle-6" />
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-4xl mx-auto text-center relative z-10">

        {/* Logo - Animates from center to top */}
        <div
          className="logo-container"
          style={{
            transform: logoAnimated
              ? 'translateY(-80px) scale(1)'
              : 'translateY(0) scale(1)',
            transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            marginBottom: logoAnimated ? '40px' : '0'
          }}
        >
          <Image
            src="/dashly-logo.png"
            alt="Dashly"
            width={320}
            height={110}
            className="mx-auto"
            style={{
              filter: 'drop-shadow(0 4px 20px rgba(165, 106, 189, 0.3))'
            }}
            priority
          />
        </div>

        {/* Typing Text */}
        <div
          className="typing-text-container"
          style={{
            minHeight: '100px',
            marginBottom: '40px',
            opacity: logoAnimated ? 1 : 0,
            transition: 'opacity 0.5s ease-in',
            transitionDelay: '0.6s'
          }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#6E3482] leading-tight">
            {displayText}
            {displayText && <span className="typing-cursor">|</span>}
          </h1>
        </div>

        {/* Feature Cards - Fade in */}
        <div
          className={`grid md:grid-cols-3 gap-6 mb-10 transition-all duration-700 ${showFeatures
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
            }`}
        >
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Real-Time Analytics"
            description="Track project health with instant insights"
            delay={0}
            show={showFeatures}
          />
          <FeatureCard
            icon={<Target className="w-6 h-6" />}
            title="Risk Assessment"
            description="Identify issues before they become problems"
            delay={200}
            show={showFeatures}
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Resource Optimization"
            description="Maximize efficiency, minimize waste"
            delay={400}
            show={showFeatures}
          />
        </div>

        {/* CTA Button - Glow effect */}
        <div
          className={`transition-all duration-700 ${showButton
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
            }`}
        >
          <Link
            href="/auth"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl cta-button"
            style={{
              background: 'linear-gradient(135deg, #A56ABD, #6E3482)'
            }}
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <p className="mt-6 text-sm text-[#A9899A]">
            No credit card required • Setup in 2 minutes
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 text-xs text-[#A9899A]">
          <p>Dashly.co © 2026. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        /* Typing cursor animation */
        .typing-cursor {
          animation: blink 1s step-end infinite;
          color: #A56ABD;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* Floating particles */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(165, 106, 189, 0.3), rgba(110, 52, 130, 0.1));
          pointer-events: none;
        }

        .particle-1 {
          width: 120px;
          height: 120px;
          top: 10%;
          left: 10%;
          animation: float-1 20s ease-in-out infinite;
        }

        .particle-2 {
          width: 80px;
          height: 80px;
          top: 60%;
          right: 15%;
          animation: float-2 15s ease-in-out infinite;
        }

        .particle-3 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          left: 20%;
          animation: float-3 18s ease-in-out infinite;
        }

        .particle-4 {
          width: 60px;
          height: 60px;
          top: 30%;
          right: 25%;
          animation: float-1 22s ease-in-out infinite 2s;
        }

        .particle-5 {
          width: 90px;
          height: 90px;
          bottom: 40%;
          right: 10%;
          animation: float-2 17s ease-in-out infinite 1s;
        }

        .particle-6 {
          width: 70px;
          height: 70px;
          top: 50%;
          left: 15%;
          animation: float-3 19s ease-in-out infinite 3s;
        }

        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.6;
          }
        }

        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-40px, 40px) scale(1.2);
            opacity: 0.5;
          }
        }

        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(35px, 35px) scale(1.15);
            opacity: 0.55;
          }
        }

        /* CTA button glow effect */
        .cta-button {
          box-shadow: 
            0 0 20px rgba(165, 106, 189, 0.3),
            0 0 40px rgba(165, 106, 189, 0.2);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 
              0 0 20px rgba(165, 106, 189, 0.3),
              0 0 40px rgba(165, 106, 189, 0.2);
          }
          50% {
            box-shadow: 
              0 0 30px rgba(165, 106, 189, 0.4),
              0 0 60px rgba(165, 106, 189, 0.3);
          }
        }
      `}</style>
    </div>
  )
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
  show: boolean
}

function FeatureCard({ icon, title, description, delay, show }: FeatureCardProps) {
  return (
    <div
      className={`bg-white/60 backdrop-blur-sm border border-[#E8E0EC] rounded-2xl p-6 transition-all duration-700 hover:scale-105 hover:shadow-xl hover:border-[#A56ABD]`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(20px)'
      }}
    >
      <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center mx-auto"
        style={{
          background: 'linear-gradient(135deg, #A56ABD, #6E3482)'
        }}
      >
        <div className="text-white">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-bold text-[#6E3482] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#A9899A]">
        {description}
      </p>
    </div>
  )
}