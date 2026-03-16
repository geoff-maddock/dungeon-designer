import React from 'react';

const CityBoard: React.FC = () => {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">City Adventure Board</h1>
      <p className="mb-4">
        Welcome to the City! Here you can visit various city establishments to earn bonuses based on the cards you drew or played, plus spending resources, and visiting multiple times.
      </p>
      <div className="grid grid-cols-4 gap-4">
        {/* Example cells */}
        <div className="bg-white p-4 rounded shadow">Cell 1</div>
        <div className="bg-white p-4 rounded shadow">Cell 2</div>
        <div className="bg-white p-4 rounded shadow">Cell 3</div>
        <div className="bg-white p-4 rounded shadow">Cell 4</div>
      </div>
    </div>
  );
};

export default CityBoard;
