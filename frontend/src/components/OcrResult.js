// src/components/OcrResult.js
import React from 'react';

const OcrResult = ({ result }) => {
  if (!result) return null;

  return (
    <div>
      <h3>OCR 결과:</h3>
      <p>{result}</p>
    </div>
  );
};

export default OcrResult;
