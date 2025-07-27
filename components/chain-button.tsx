import React from "react";

interface ChainButtonProps {
  networkIconSrc?: string | null;
  networkIconAlt?: string;
  networkIconElement?: React.ReactNode;
  onClick?: () => void;
}

export default function ChainButton({
  networkIconSrc,
  networkIconAlt = "Network",
  networkIconElement,
  onClick,
}: ChainButtonProps) {
  return (
    <div 
      className="
        relative w-[109px] h-[64px] bg-[#f5f5f7]
        rounded-tl-[25px] rounded-tr-[40px] rounded-bl-[25px] rounded-br-[40px]
        overflow-visible flex items-center pl-[18px] cursor-pointer
      "
      onClick={onClick}
    >
      {/* Chevron */}
      <svg
        className="shrink-0"
        width="24" height="25" viewBox="0 0 24 25" fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.3309 18.3584C12.6724 18.3566 12.9814 18.2255 13.2352 17.9586L20.8833 10.1234C21.1029 9.90385 21.2213 9.63224 21.2213 9.31423C21.2213 8.65812 20.7121 8.14062 20.0614 8.14062C19.7434 8.14062 19.4473 8.26819 19.2205 8.49218L11.8391 16.0625H12.8217L5.43298 8.49218C5.21261 8.2718 4.9183 8.14062 4.59024 8.14062C3.93775 8.14062 3.4303 8.65812 3.4303 9.31423C3.4303 9.63044 3.55063 9.90204 3.76659 10.1317L11.4182 17.9586C11.6886 18.2291 11.9829 18.3584 12.3309 18.3584Z"
          fill="black"
        />
      </svg>

      {/* Spacer */}
      <div className="w-2" />

      {/* USDT + network icon in relative container */}
      <div className="relative w-[54px] h-[54px]">
        {/* USDC Icon */}
        <img
          src="/USDC.svg"
          alt="USDC"
          width={54}
          height={54}
          style={{ display: "block", width: "54px", height: "54px" }}
          draggable={false}
        />

        {(networkIconSrc || networkIconElement) && (
          <div
            className="absolute"
            style={{
              right: "-3px",
              bottom: "-3px",
              width: 26,
              height: 26,
              pointerEvents: "none",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white z-10"
              style={{
                width: 30,
                height: 30,
                pointerEvents: "none",
              }}
            />
            <div className="relative w-[26px] h-[26px] rounded-full overflow-hidden z-20">
              {networkIconElement ? (
                networkIconElement
              ) : (
                <img
                  src={networkIconSrc || ""}
                  alt={networkIconAlt}
                  width={26}
                  height={26}
                  style={{
                    display: "block",
                    width: "26px",
                    height: "26px",
                  }}
                  draggable={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 