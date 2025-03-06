import React from 'react';

const ForestBoard: React.FC = () => {
  return (
    <div className="p-4 bg-green-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Forest Adventure Board</h1>
      <p className="mb-4">
        Welcome to the Enchanted Forest! Here you can gather resources that can be collected and used to improve your abilities, heal your character, or sell for gold. The more you explore specific areas, the more special bonuses you will earn. Beware, there is a small chance of encountering danger.
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

export default ForestBoard;
