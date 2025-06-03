import { Link } from 'react-router-dom';

interface StatusWidgetProps {
  count: number;
  label: string;
  sublabel: string;
  color: string;
}

const StatusWidget = ({ count, label, sublabel, color }: StatusWidgetProps) => {
  const slug = label.toLowerCase().replace(/\s+/g, '-'); // napr. "New Orders" -> "new-orders"

  return (
    <Link to={`/status/${slug}`} className="block">
      <div className="flex items-center bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer">
        {/* Ľavý farebný pruh so zaoblením */}
        <div
          className="h-12 w-12 flex items-center justify-center text-white font-bold text-md rounded-l-lg"
          style={{ backgroundColor: color }}
        >
          {count}
        </div>

        {/* Textová časť */}
        <div className="ml-4">
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500">{sublabel}</div>
        </div>

        {/* Ikona oka vpravo */}
        <div className="ml-auto text-gray-300 hover:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3C5.454 3 1.85 6.196 1.116 10c.734 3.804 4.338 7 8.884 7s8.15-3.196 8.884-7c-.734-3.804-4.338-7-8.884-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
            <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default StatusWidget;
