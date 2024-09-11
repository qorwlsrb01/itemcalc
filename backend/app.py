from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import unicodedata  # 한글 파일명 처리를 위한 라이브러리
import cv2  # OpenCV 라이브러리
from werkzeug.utils import secure_filename  # ASCII로 안전한 파일명 처리
from image_processing import process_image

app = Flask(__name__)
CORS(app)  # 모든 출처를 허용합니다.

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed_uploads'
ITEM_IMAGES_FOLDER = 'item_images'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(ITEM_IMAGES_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['ITEM_IMAGES_FOLDER'] = ITEM_IMAGES_FOLDER

@app.route("/")
def index():
    return "플라스크 서버 정상 실행 중"

@app.route('/processed_uploads/<filename>')
def serve_processed_image(filename):
    return send_from_directory(PROCESSED_FOLDER, filename)

@app.route('/item_images/<filename>')
def serve_item_image(filename):
    return send_from_directory(ITEM_IMAGES_FOLDER, filename)

@app.route('/ocr', methods=['POST'])
def ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # 파일명을 임시로 안전하게 변환 (ASCII 파일명 사용)
        original_filename = file.filename
        safe_filename = secure_filename(original_filename)  # ASCII로 변환된 파일명
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        file.save(file_path)

        # OpenCV로 파일이 제대로 읽히는지 확인
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found after saving'}), 500

        image = cv2.imread(file_path)
        if image is None:
            return jsonify({'error': 'Could not read the image file'}), 500

        # 이미지 처리 함수 호출
        results = process_image(file_path, app.config['PROCESSED_FOLDER'], app.config['ITEM_IMAGES_FOLDER'])
        
        # 처리 후 임시 파일 삭제 (원본 파일명을 유지)
        os.remove(file_path)

        return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)