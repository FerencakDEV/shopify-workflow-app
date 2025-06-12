import React from 'react';

export interface StatusWidgetProps {
  statusKey: string;
  label: string;
  sublabel: string;
  color: string;
  count: number;
  onClick?: () => void;
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({
  statusKey,
  label,
  sublabel,
  color,
  count,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer min-h-[110px]"
    >
      <div
        className="h-14 w-14 flex items-center justify-center font-bold text-lg rounded-l-lg"
        style={{
          backgroundColor: color,
          color: getTextColor(color),
        }}
      >
        {count}
      </div>

      <div className="ml-5">
        <div className="text-base font-semibold text-gray-800">{label}</div>
        <div className="text-sm text-gray-500">{sublabel}</div>
      </div>

      <div className="ml-auto text-gray-300 hover:text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3C5.454 3 1.85 6.196 1.116 10c.734 3.804 4.338 7 8.884 7s8.15-3.196 8.884-7c-.734-3.804-4.338-7-8.884-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
          <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
      </div>
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
