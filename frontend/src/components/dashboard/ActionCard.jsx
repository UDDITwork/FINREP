function ActionCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
        </div>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default ActionCard;