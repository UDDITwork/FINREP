function ActionCard({ icon: Icon, title, description, buttonText, onClick }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className="p-3 sm:p-4 bg-gray-100 rounded-full">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
        </div>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">{description}</p>
      <button
        onClick={onClick}
        className="w-full sm:w-auto px-4 py-2 bg-[#1e3a5f] text-white text-sm sm:text-base font-medium rounded-lg hover:bg-[#2a4a7f] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-opacity-50"
      >
        {buttonText}
      </button>
    </div>
  );
}

export default ActionCard;