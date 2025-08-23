function MetricCard({ icon: Icon, title, value, trend, trendText, iconColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${iconColor}`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">{trend}</p>
          )}
        </div>
        {trendText && (
          <div className="text-right ml-2">
            <span className="text-xs text-gray-500">{trend}</span>
            <p className="text-xs sm:text-sm font-medium text-gray-900 mt-1">{trendText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;