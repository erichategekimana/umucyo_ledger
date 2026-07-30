interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export const StatCard = ({ title, value, icon, color = 'bg-blue-100 text-blue-800' }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      {icon && <div className={`p-3 rounded-full ${color} mr-4`}>{icon}</div>}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
};