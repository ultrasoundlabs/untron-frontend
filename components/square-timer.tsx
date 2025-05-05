'use client';

import { useEffect, useState, ReactNode } from 'react';

type Props = {
  /** How many seconds to give to the user (e.g. 600 = 10 min) */
  total: number;
  /** Diameter of the inner square (without the border), px */
  size?: number;
  /** Line thickness, px */
  stroke?: number;
  /** Current time, seconds */
  currentTime?: number;
  /** Handler of time change */
  onTimeChange?: (seconds: number) => void;
  /** Content inside the timer */
  children?: ReactNode;
  /** radius of rounded corners */
  borderRadius?: number;
};

export default function SquareTimer({
  total,
  size = 220,
  stroke = 6,
  currentTime,
  onTimeChange,
  children,
  borderRadius = 54,
}: Props) {
  const [left, setLeft] = useState(currentTime ?? total); // seconds left
  const ratio = left / total; // 1 … 0
  
  // Calculate the perimeter, considering the rounded corners
  const straightLength = (size) * 4 - 8 * borderRadius; // straight parts
  const curvedLength = 2 * Math.PI * borderRadius; // arcs (4 quarters of a circle)
  const length = straightLength + curvedLength;

  // If currentTime is passed as a prop, use it
  useEffect(() => {
    if (currentTime !== undefined) {
      setLeft(currentTime);
    }
  }, [currentTime]);

  // tick every second
  useEffect(() => {
    if (!left) return;
    const id = setTimeout(() => {
      const newTime = left - 1;
      setLeft(newTime);
      onTimeChange?.(newTime);
    }, 1000);
    return () => clearTimeout(id);
  }, [left, onTimeChange]);

  // color of phase
  const color =
    ratio <= 0.1 ? '#FF002E' : ratio <= 0.4 ? '#FFB547' : '#00E0AC';

  // Define path starting from the top center
  const getPath = () => {
    const halfSize = size / 2;
    const cornerRadius = borderRadius;
    
    return `
      M ${halfSize}, 0
      
      H ${size - cornerRadius}
      Q ${size}, 0 ${size}, ${cornerRadius}
      V ${size - cornerRadius}
      Q ${size}, ${size} ${size - cornerRadius}, ${size}
      
      H ${cornerRadius}
      Q 0, ${size} 0, ${size - cornerRadius}
      V ${cornerRadius}
      Q 0, 0 ${cornerRadius}, 0
      
      H ${halfSize}
    `;
  };

  // Calculate the total width and height including the stroke
  const totalSize = size + stroke;
  // Calculate the half stroke width for positioning
  const halfStroke = stroke / 2;

  return (
    <div 
      className="relative inline-block" 
      style={{ width: totalSize, height: totalSize }}
    >
      {/* SVG timer border - positioned with offset to center the stroke */}
      <svg
        className="absolute"
        viewBox={`0 0 ${size} ${size}`}
        style={{ 
          width: size,
          height: size,
          top: halfStroke,
          left: halfStroke,
          overflow: 'visible' 
        }}
      >
        {/* background path */}
        <path
          d={getPath()}
          fill="none"
          stroke="#EFEFEF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* animated path that starts from top center */}
        <path
          d={getPath()}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - ratio)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* QR-code or any children content - positioned with offset to account for the stroke */}
      <div 
        className="absolute flex items-center justify-center bg-white"
        style={{ 
          borderRadius: `${borderRadius}px`,
          top: stroke,
          left: stroke,
          right: stroke,
          bottom: stroke
        }}
      >
        {children}
      </div>
    </div>
  );
} 