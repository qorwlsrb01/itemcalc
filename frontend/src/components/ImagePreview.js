// src/components/ImagePreview.js
import React from 'react';

const ImagePreview = ({ imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <div>
      <h3>업로드된 이미지:</h3>
      <img src={imageUrl} alt="Uploaded" style={{ border: '1px solid #000' }} />
    </div>
  );
};

export default ImagePreview;
