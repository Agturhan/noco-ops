import React from 'react';

export const BlurText = ({ text = '', delay = 200, className = '' }: { text?: string, delay?: number, className?: string }) => {
    return (
        <h1 className={`text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl ${className}`}>
            <span className="inline-block animate-blur-in opacity-0" style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}>
                {text}
            </span>
        </h1>
    );
};

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    colors?: string[];
    animationSpeed?: number;
    showBorder?: boolean;
}

export const GradientText = ({ children, className = "", colors = ["#40ffaa", "#4079ff", "#40ffaa"], animationSpeed = 8, showBorder = false }: GradientTextProps) => {
    const gradientStyle = {
        backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
        animationDuration: `${animationSpeed}s`,
    };

    return (
        <div className={`relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-[1.25rem] font-medium backdrop-blur transition-shadow duration-500 overflow-hidden cursor-pointer ${className}`}>
            {showBorder && (
                <div
                    className="absolute inset-0 bg-cover z-0 pointer-events-none animate-gradient"
                    style={{
                        ...gradientStyle,
                        backgroundSize: "300% 100%",
                    }}
                >
                    <div
                        className="absolute inset-0 bg-black rounded-[1.25rem] z-[-1]"
                        style={{
                            width: "calc(100% - 2px)",
                            height: "calc(100% - 2px)",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                    ></div>
                </div>
            )}
            <div
                className="inline-block relative z-2 bg-cover bg-clip-text text-transparent pointer-events-none animate-gradient"
                style={{
                    ...gradientStyle,
                    backgroundSize: "300% 100%",
                }}
            >
                {children}
            </div>
        </div>
    );
}

export const ShinyText = ({ text = "", disabled = false, speed = 3, className = "" }) => {
    const animationDuration = `${speed}s`;

    return (
        <div
            className={`text-[#b5b5b5a4] bg-clip-text inline-block ${disabled ? "" : "animate-shine"} ${className}`}
            style={{
                backgroundImage:
                    "linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                animationDuration: animationDuration,
            }}
        >
            {text}
        </div>
    );
};
