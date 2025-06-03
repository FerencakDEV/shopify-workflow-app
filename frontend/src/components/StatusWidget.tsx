import { Eye } from 'lucide-react';

interface StatusWidgetProps {
  count: number;
  label: string;
  sublabel: string;
  color: string;
}

const StatusWidget = ({ count, label, sublabel, color }: StatusWidgetProps) => {
  return (
    <div className="relative bg-white rounded-xl p-4 shadow hover:shadow-md transition flex flex-col justify-between min-h-[100px]">
      {/* Ikonka oka v pravom hornom rohu */}
      <div className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 cursor-pointer">
        <Eye size={16} />
      </div>

      {/* Počet */}
      <div className="text-3xl font-bold" style={{ color }}>{count}</div>

      {/* Texty */}
      <div className="text-base font-medium text-gray-800">{label}</div>
      <div className="text-sm text-gray-500">{sublabel}</div>
    </div>
  );
};

export default StatusWidget;
