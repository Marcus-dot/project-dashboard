'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface DashlyLoaderProps {
    onComplete?: () => void
    duration?: number
}

export default function DashlyLoader({
    onComplete,
    duration = 4000 // 4 seconds - longer so animation is visible
}: DashlyLoaderProps) {
    const [progress, setProgress] = useState(0)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        const interval = 16 // 60fps
        const increment = (100 / duration) * interval

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment
                if (next >= 100) {
                    clearInterval(timer)
                    setTimeout(() => {
                        setIsExiting(true)
                        setTimeout(() => onComplete?.(), 500)
                    }, 300)
                    return 100
                }
                return next
            })
        }, interval)

        return () => clearInterval(timer)
    }, [duration, onComplete])

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'
                }`}
            style={{
                background: 'linear-gradient(135deg, #FBFEF9, #F5F0F6)'
            }}
        >
            <div className="flex flex-col items-center gap-12 w-full max-w-[450px] px-5">
                {/* Logo with Shimmer Effect */}
                <div className="relative w-full max-w-[320px] h-[120px] flex items-center justify-center overflow-hidden">
                    <Image
                        src="/dashly-logo.png"
                        alt="Dashly"
                        width={320}
                        height={120}
                        className="w-full h-auto object-contain"
                        style={{
                            filter: 'drop-shadow(0 4px 20px rgba(165, 106, 189, 0.3))'
                        }}
                        priority
                    />

                    {/* Shimmer overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none shimmer-overlay"
                    />
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-[380px]">
                    <div className="w-full h-[5px] bg-[#E8E0EC] rounded-full overflow-hidden mb-4 shadow-inner">
                        <div
                            className="h-full rounded-full transition-all duration-100 ease-linear progress-bar"
                            style={{
                                width: `${progress}%`
                            }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6E3482] font-medium tracking-wide">
                            Loading your dashboard
                        </span>
                        <span className="text-[#A56ABD] font-bold text-lg">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute w-[5px] h-[5px] rounded-full bg-[#A56ABD] opacity-70 particle particle-1" style={{ top: '15%', left: '10%' }} />
                    <div className="absolute w-[5px] h-[5px] rounded-full bg-[#A9899A] opacity-70 particle particle-2" style={{ top: '35%', right: '15%' }} />
                    <div className="absolute w-[5px] h-[5px] rounded-full bg-[#6E3482] opacity-70 particle particle-3" style={{ bottom: '25%', left: '20%' }} />
                    <div className="absolute w-[5px] h-[5px] rounded-full bg-[#A56ABD] opacity-70 particle particle-4" style={{ top: '55%', right: '25%' }} />
                    <div className="absolute w-[5px] h-[5px] rounded-full bg-[#A9899A] opacity-70 particle particle-5" style={{ bottom: '40%', right: '10%' }} />
                    <div className="absolute w-[5px] h-[5px] rounded-full bg-[#6E3482] opacity-70 particle particle-6" style={{ top: '25%', left: '30%' }} />
                </div>
            </div>

            <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        .shimmer-overlay {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          animation: shimmer 2.5s ease-in-out infinite;
        }

        .progress-bar {
          background: linear-gradient(90deg, #A56ABD, #6E3482);
          box-shadow: 0 0 10px rgba(165, 106, 189, 0.5);
        }

        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.5; 
          }
          50% { 
            transform: translate(15px, -20px) scale(1.8); 
            opacity: 0.9; 
          }
        }

        .particle-1 {
          animation: float 4s ease-in-out infinite;
        }

        .particle-2 {
          animation: float 5s ease-in-out infinite;
        }

        .particle-3 {
          animation: float 4.5s ease-in-out infinite;
        }

        .particle-4 {
          animation: float 4s ease-in-out infinite 1.5s;
        }

        .particle-5 {
          animation: float 5s ease-in-out infinite 1s;
        }

        .particle-6 {
          animation: float 4.5s ease-in-out infinite 2s;
        }
      `}</style>
        </div>
    )
}