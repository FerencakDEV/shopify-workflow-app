interface StatusWidgetProps {
  count: number;
  label: string;
  sublabel: string;
  color: string;
}

const StatusWidget = ({ count, label, sublabel, color }: StatusWidgetProps) => {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl shadow p-4 w-full hover:shadow-md transition">
      <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-white`} style={{ backgroundColor: color }}>
        {count}
      </div>
      <div className="flex flex-col">
        <span className="text-base font-medium">{label}</span>
        <span className="text-sm text-gray-500">{sublabel}</span>
      </div>
    </div>
  );
};

export default StatusWidget;
