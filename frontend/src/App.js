import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import ApiData from './ApiData';
import Calculate from './Calculate';
import './App.css';

function App() {
  const [selectedSlot, setSelectedSlot] = useState({});
  const [characterInfo, setCharacterInfo] = useState({});
  const [userOcid, setUserOcid] = useState(null);
  const [calculatedStats, setCalculatedStats] = useState({});
  const [imageUploadStats, setImageUploadStats] = useState({}); // New state for stats

  const handleCategoryDetected = (category) => {
    setSelectedSlot(category);
  };

  const handleCalculatedStatsUpdate = (stats) => {
    setCalculatedStats(stats);
  };

  const handleImageUploadStatsUpdate = (stats) => {
    setImageUploadStats(stats); // Update stats here
  };

  return (
    <div className="App">
      <div className="container">
        <ApiData 
          selectedSlot={selectedSlot[0]} 
          setCharacterInfo={setCharacterInfo} 
          characterInfo={characterInfo}
          setUserOcid={setUserOcid}
          onCalculatedStats={handleCalculatedStatsUpdate}
        />
        <ImageUpload
          onCategoryDetected={handleCategoryDetected}
          characterInfo={characterInfo}
          onImageUploadStats={handleImageUploadStatsUpdate} // Pass handler as prop
        />
        <Calculate
          userOcid={userOcid}
          calculatedStats={calculatedStats}
          characterInfo={characterInfo}
          imageUploadStats={imageUploadStats} // Pass stats to Calculate if needed
        />
      </div>
    </div>
  );
}

export default App;
