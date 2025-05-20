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
        {/* USDT Icon */}
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_usdt)">
            <path
              d="M27 54C41.9117 54 54 41.9117 54 27C54 12.0883 41.9117 0 27 0C12.0883 0 0 12.0883 0 27C0 41.9117 12.0883 54 27 54Z"
              fill="#009393"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M27.0331 28.93C31.6764 28.93 35.557 28.145 36.5054 27.096C35.7001 26.2064 32.7875 25.5057 29.0885 25.314V27.53C28.4263 27.5645 27.7378 27.5813 27.0324 27.5813C26.3271 27.5813 25.6386 27.5645 24.975 27.53V25.314C21.2774 25.5057 18.3634 26.2064 17.5581 27.096C18.5079 28.145 22.3891 28.93 27.0324 28.93H27.0331ZM35.283 18.4992V21.5509H29.0885V23.667C33.4395 23.8931 36.7045 24.8233 36.7288 25.9364V28.257C36.7045 29.3701 33.4395 30.2982 29.0885 30.525V35.7185H24.9757V30.525C20.6247 30.2989 17.361 29.3701 17.3367 28.257V25.9364C17.361 24.8233 20.6247 23.8931 24.9757 23.667V21.5509H18.7812V18.4992H35.2836H35.283ZM16.3452 13.6426H38.091C38.6107 13.6426 39.0893 13.916 39.3485 14.3601L45.6834 25.2384C46.0114 25.8027 45.9142 26.5148 45.4458 26.9718L28.0078 43.994C27.4422 44.5454 26.5336 44.5454 25.9693 43.994L8.55295 26.9948C8.07438 26.5263 7.98393 25.7939 8.33695 25.2269L15.1092 14.3264C15.3732 13.9025 15.8416 13.6433 16.3458 13.6433L16.3452 13.6426Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_usdt">
              <rect width="54" height="54" fill="white" />
            </clipPath>
          </defs>
        </svg>

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