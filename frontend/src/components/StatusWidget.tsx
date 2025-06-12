import React from 'react';

export interface StatusWidgetProps {
  statusKey: string;
  label: string;
  sublabel: string;
  color: string;
  count: number;
  onClick?: () => void;
  fullscreen?: boolean;
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({
  statusKey,
  label,
  sublabel,
  color,
  count,
  onClick,
  fullscreen = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-full h-full bg-white shadow-sm hover:shadow-md transition cursor-pointer ${
        fullscreen
          ? 'flex flex-col items-center justify-center text-center p-6'
          : 'flex items-center p-4 rounded-lg'
      }`}
    >
      <div
        className={`flex items-center justify-center font-bold rounded-lg ${
          fullscreen
            ? 'h-[6rem] w-[6rem] text-[2.5rem] mb-4'
            : 'h-12 w-12 text-md rounded-l-lg'
        }`}
        style={{
          backgroundColor: color,
          color: getTextColor(color),
        }}
      >
        {count}
      </div>

      <div className={fullscreen ? '' : 'ml-4'}>
        <div
          className={`font-semibold text-gray-800 ${
            fullscreen ? 'text-[1.8rem] leading-tight' : 'text-sm'
          }`}
        >
          {label}
        </div>
        <div
          className={`text-gray-500 ${fullscreen ? 'text-lg mt-1' : 'text-xs'}`}
        >
          {sublabel}
        </div>
      </div>

      {!fullscreen && (
        <div className="ml-auto text-gray-300 hover:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3C5.454 3 1.85 6.196 1.116 10c.734 3.804 4.338 7 8.884 7s8.15-3.196 8.884-7c-.734-3.804-4.338-7-8.884-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
            <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </div>
      )}
    </div>
  );
};

function getTextColor(bgColor: string): string {
  try {
    const hex = bgColor.trim().replace('#', '');
    if (hex.length !== 6) return '#1a1a1a';

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? '#1a1a1a' : '#ffffff';
  } catch {
    return '#1a1a1a';
  }
}
