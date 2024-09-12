import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import setItemList from './setItemList.json';

function ImageUpload({ onCategoryDetected, characterInfo, onImageUploadStats }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [itemImages, setItemImages] = useState([]);
  const [refinedResults, setRefinedResults] = useState({
    part: [],
    name: [],
    default_option: [],
    up_jamje: [],
    down_jamje: [],
    soul: []
  });
  const [stats, setStats] = useState({
    "세트": "정보 없음",
    "공마": 0,
    "주스탯": 0,
    "부스탯": 0,
    "부스탯2": 0,
    "올스탯": 0,
    "공마%": 0,
    "주스탯%": 0,
    "부스탯%": 0,
    "부스탯2%": 0,
    "보공": 0,
    "방무": 0,
    "데미지": 0,
    "크뎀": 0,
    "쿨감": 0,
    "9렙당주스탯": 0,
    "9렙당부스탯": 0,
    "9렙당부스탯2": 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState("정보 없음");
  const [selectedPart, setSelectedPart] = useState("");
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (refinedResults.part.length > 0) {
      setSelectedPart(refinedResults.part[0]);
    }
  }, [refinedResults.part]);

  useEffect(() => {
    if (onImageUploadStats) {
      onImageUploadStats(stats);
    }
  }, [stats, onImageUploadStats]);

  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            handleFileUpload(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleFileUpload = (file) => {
    if (!file) {
      setFile(null);
      setPreview(null);
      setProcessedImage(null);
      return;
    }
    
    setFile(file);
    setPreview(URL.createObjectURL(file));  // This will only execute if the file is valid
    setProcessedImage(null);
  };

  const handleChange = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://itemcalc.site/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { processed_image, item_images, refined_results } = response.data;
      setProcessedImage(`http://itemcalc.site/api/processed_uploads/${processed_image}`);
      const itemImageURLs = item_images.map(imgName => `http://itemcalc.site/api/item_images/${imgName}`);
      setItemImages(itemImageURLs);
      const extractedStats = extractCharacterStats(refined_results);
      setStats(extractedStats);
      setRefinedResults(refined_results);

      if (refined_results.part.length > 0) {
        onCategoryDetected(refined_results.part);
      }
    } catch (error) {
      alert('이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const extractCharacterStats = (refinedResults) => {
    const determineSet = (itemName) => {
      for (const [setName, items] of Object.entries(setItemList)) {
        if (items.includes(itemName)) {
          return setName;
        }
      }
      return "정보 없음";
    };

    const characterStats = {
      "세트": determineSet(refinedResults.name[0]),
      "공마": characterInfo.공마,
      "주스탯": characterInfo.주스탯,
      "부스탯": characterInfo.부스탯,
      "부스탯2": characterInfo.부스탯2,
      "올스탯": "올스탯",
      "공마%": characterInfo.공마 + "%",
      "주스탯%": characterInfo.주스탯 + "%",
      "부스탯%": characterInfo.부스탯 + "%",
      "부스탯2%": characterInfo.부스탯2 + "%",
      "보공": "보공",
      "방무": "방무",
      "데미지": "데미지",
      "크뎀": "크뎀",
      "쿨감": "쿨감",
      "9렙당주스탯": "9렙당 " + characterInfo.주스탯 + ".",
      "9렙당부스탯": "9렙당 " + characterInfo.부스탯 + ".",
      "9렙당부스탯2": "9렙당 " + characterInfo.부스탯2 + "."
    };

    const stats = {
      "세트": characterStats["세트"],
      "공마": 0,
      "주스탯": 0,
      "부스탯": 0,
      "부스탯2": 0,
      "올스탯": 0,
      "공마%": 0,
      "주스탯%": 0,
      "부스탯%": 0,
      "부스탯2%": 0,
      "보공": 0,
      "방무": 0,
      "데미지": 0,
      "크뎀": 0,
      "쿨감": 0,
      "9렙당주스탯": 0,
      "9렙당부스탯": 0,
      "9렙당부스탯2": 0
    };

    const regex = /(\d+)(%?)$/;

    const processCategory = (categoryArray) => {
      categoryArray.forEach(item => {
        const [label, value] = item.split(': ').map(str => str.trim());
        let key = Object.keys(characterStats).find(k => characterStats[k] === label);

        if (key) {
          const match = value.match(regex);
          if (match) {
            const [_, number, percent] = match;
            const numericValue = parseFloat(number);
            if (!isNaN(numericValue)) {
              if (percent && ['보공', '데미지', '크뎀', '올스탯'].includes(key)) {
                stats[key] += numericValue;
              } else if (['방무'].includes(key)){
                stats["방무"] = (1-(1-stats["방무"]/100)*(1-numericValue/100))*100;
                stats["방무"] = parseFloat(stats["방무"].toFixed(3));
              }
              else if (percent) {
                stats[key + '%'] += numericValue;
              } else {
                if (key === '올스탯') {
                  stats['주스탯'] += numericValue;
                  stats['부스탯'] += numericValue;
                  stats['부스탯2'] += numericValue;
                } else {
                  stats[key] += numericValue;
                }
              }
            }
          }
          else {
            const regex = /(\d+)(초?)$/;
            const match = value.match(regex);
            const [_, number, percent] = match;
            const numericValue = parseFloat(number);
            stats['쿨감'] += numericValue;
          }
        }
      });
    };

    processCategory(refinedResults.default_option);
    processCategory(refinedResults.up_jamje);
    processCategory(refinedResults.down_jamje);
    processCategory(refinedResults.soul);
    return stats;
  };

  const setOptions = Object.keys(setItemList).map(setName => ({ value: setName, label: setName }));
  const partOptions =["무기", "보조무기", "엠블렘","모자", "상의", "하의", "장갑", "망토", "신발","어깨장식", "얼굴장식", "눈장식", "귀고리", "벨트", "포켓 아이템", "뱃지","반지1", "반지2", "반지3", "반지4", "펜던트", "펜던트2", "기계 심장"].map(part => ({ value: part, label: part }));

  const categoryOrder = ['name', 'default_option', 'up_jamje', 'down_jamje', 'soul'];

  const handleSetChange = (event) => {
    setSelectedSet(event.target.value);
    setStats(prevStats => ({ ...prevStats, "세트": event.target.value }));
  };

  const handlePartChange = (event) => {
    setSelectedPart(event.target.value);
    onCategoryDetected([event.target.value]);
  };

  const toggleOptions = () => {
    setIsOptionsExpanded(prevState => !prevState);
  };

  const handleOverlayClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <div onClick={handleOverlayClick} style={{
        border: '2px dashed #ccc',
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        marginBottom: '20px'
      }}>
        <p>여기를 클릭해서 이미지를 업로드거나</p>
      </div>
      <div style={{textAlign: 'center'}}>여기를 클릭하고 이미지를 붙여넣으세요</div>
      
      <button onClick={handleUpload} disabled={loading}>
        {loading ? '업로드 중...' : '이미지 인식'}
      </button>

      {(preview && !processedImage) && (
        <div>
          <h3>원본 이미지 미리보기:</h3>
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px' }} />
        </div>
      )}

      {processedImage && (
        <div>
          <h3>추출된 아이템 이미지:</h3>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {itemImages.map((imgURL, index) => (
              <div key={index} style={{ marginRight: '10px' }}>
                <img src={imgURL} alt={`Item ${index}`} style={{ maxWidth: '300px', maxHeight: '400px' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {refinedResults.name.length === 0 && (
        <div>
          <h3>세트 선택</h3>
          <select value={selectedSet} onChange={handleSetChange}>
            {setOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <h3>파트 선택</h3>
          <select value={selectedPart} onChange={handlePartChange}>
            {partOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h3 onClick={toggleOptions} style={{ cursor: 'pointer' }}>
          옵션 {isOptionsExpanded ? '▲' : '▼'}
        </h3>
        {isOptionsExpanded && (
          <div>
            {categoryOrder.map((category) => (
              <div key={category}>
                <h4>{category}</h4>
                {Array.isArray(refinedResults[category]) && refinedResults[category].length > 0 ? (
                  <ul>
                    {refinedResults[category].map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>해당 항목이 없습니다.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3>장비 스탯</h3>
        {Object.keys(stats).map((stat) => (
          <div key={stat}>
            <div>{stat} : {stats[stat] !== 0 ? stats[stat] : '0'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUpload;
