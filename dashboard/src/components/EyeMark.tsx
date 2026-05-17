"use client";

/**
 * EyeMark — the animated "Eye" graphic for the hero.
 * An AI/camera eye: gradient iris, aperture blades, a recording pulse, and a
 * periodic blink. Drop it inline in the headline in place of the word "Eyes".
 */
export function EyeMark({ size = 64 }: { size?: number }) {
  const w = size * 1.9;
  return (
    <span
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        lineHeight: 0,
        filter: "drop-shadow(0 0 14px rgba(101,209,149,0.35))",
      }}
    >
      <svg
        width={w}
        height={size}
        viewBox="0 0 190 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Eye"
      >
        <defs>
          <radialGradient id="iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bfe9ff" />
            <stop offset="38%" stopColor="#79b8ff" />
            <stop offset="100%" stopColor="#65d195" />
          </radialGradient>
          <linearGradient id="lid" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#79b8ff" />
            <stop offset="100%" stopColor="#65d195" />
          </linearGradient>
          <clipPath id="eyeClip">
            <path d="M5 50 Q95 -2 185 50 Q95 102 5 50 Z" />
          </clipPath>
        </defs>

        {/* Eye outline */}
        <path
          d="M5 50 Q95 -2 185 50 Q95 102 5 50 Z"
          stroke="url(#lid)"
          strokeWidth="3.5"
          fill="#0b0d10"
        />

        {/* Iris + pupil + aperture — collapses on blink */}
        <g clipPath="url(#eyeClip)">
          <g className="eye-blink" style={{ transformOrigin: "95px 50px" }}>
            <circle cx="95" cy="50" r="30" fill="url(#iris)" />
            {/* aperture blades */}
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <rect
                key={a}
                x="93"
                y="22"
                width="4"
                height="20"
                rx="2"
                fill="rgba(8,12,18,0.55)"
                transform={`rotate(${a} 95 50)`}
              />
            ))}
            <circle cx="95" cy="50" r="13" fill="#080c12" />
            {/* recording pulse */}
            <circle cx="95" cy="50" r="5" fill="#65d195" className="eye-rec" />
            {/* specular highlight */}
            <circle cx="85" cy="40" r="5" fill="#ffffff" opacity="0.9" />
          </g>
        </g>

        {/* scan line — "the eyes watch" */}
        <g clipPath="url(#eyeClip)">
          <rect
            className="eye-scan"
            x="0"
            y="0"
            width="190"
            height="3"
            fill="rgba(121,184,255,0.55)"
          />
        </g>

        <style>{`
          @keyframes eyeBlink {
            0%, 92%, 100% { transform: scaleY(1); }
            96% { transform: scaleY(0.06); }
          }
          @keyframes eyeRec {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.25; }
          }
          @keyframes eyeScan {
            0% { transform: translateY(8px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(92px); opacity: 0; }
          }
          .eye-blink { animation: eyeBlink 5s ease-in-out infinite; }
          .eye-rec { animation: eyeRec 1.6s ease-in-out infinite; }
          .eye-scan { animation: eyeScan 3.2s linear infinite; }
        `}</style>
      </svg>
    </span>
  );
}
