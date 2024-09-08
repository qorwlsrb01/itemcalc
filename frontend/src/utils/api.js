// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const uploadImage = (formData) => {
  return axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob', // 서버에서 반환된 이미지를 처리하기 위해 responseType을 blob으로 설정
  });
};

export const ocrImage = (formData) => {
  return axios.post(`${API_BASE_URL}/ocr`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
