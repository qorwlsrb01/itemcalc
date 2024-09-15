import cv2
import numpy as np
import uuid
import os
import requests
import json
import time
import re
from datetime import datetime, timedelta
import dhash
from PIL import Image

# CLOVA OCR API 설정
api_url = 'https://scshh1yp41.apigw.ntruss.com/custom/v1/33769/817b93cffa214d605aadf8839a7ac5587092be08b6ee46c2655b9b011dec3d48/general'
secret_key = 'RFVOVXJEc2p2TVlLcUpuWmRCRWdDaEdxR0VoenNabmM='

def dhash(image, hash_size=8):
    """
    Compute the dhash of an image.
    """
    image = image.convert('L')  # Convert image to grayscale
    resized = image.resize(
        (hash_size + 1, hash_size),  # Resize image to hash size + 1 width and hash size height
        Image.Resampling.LANCZOS  # Use LANCZOS resampling filter
    )
    diff = np.array(resized)[:, 1:] > np.array(resized)[:, :-1]  # Compare adjacent pixels
    return sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])  # Compute hash value

def dhash_image(image, hash_size=8):
    """
    Compute the dhash of an image using the given hash size.
    """
    return dhash(image, hash_size)

def replace_color_in_image(image, target_colors, replacement_color):
    # BGR로 변환
    replacement_bgr = [int(replacement_color[i:i+2], 16) for i in (1, 3, 5)]
    
    # 변환할 색상들을 BGR로 변환
    target_bgr_colors = [ [int(color[i:i+2], 16) for i in (1, 3, 5)] for color in target_colors ]
    
    # 색상 변경을 위한 마스크를 하나의 큰 마스크로 결합
    combined_mask = np.zeros(image.shape[:2], dtype=np.uint8)
    for target_bgr in target_bgr_colors:
        # 색상 범위 설정
        lower_bound = np.array(target_bgr) - 150
        upper_bound = np.array(target_bgr) + 150
        lower_bound = np.clip(lower_bound, 0, 255)
        upper_bound = np.clip(upper_bound, 0, 255)
        
        # 색상 마스크 생성
        mask = cv2.inRange(image, lower_bound, upper_bound)
        combined_mask = cv2.bitwise_or(combined_mask, mask)
    
    # 색상 변경
    image[combined_mask > 0] = replacement_bgr

    return image

def clova_ocr(image_path):
    request_json = {
        'images': [
            {
                'format': 'jpg',
                'name': 'demo'
            }
        ],
        'requestId': str(uuid.uuid4()),
        'version': 'V2',
        'timestamp': int(round(time.time() * 1000))
    }

    payload = {'message': json.dumps(request_json).encode('UTF-8')}
    files = [('file', open(image_path, 'rb'))]
    headers = {'X-OCR-SECRET': secret_key}

    response = requests.post(api_url, headers=headers, data=payload, files=files)
    result = response.json()

    # 결과 파싱
    parsed_text = []
    for item in result['images'][0]['fields']:
        parsed_text.append(item['inferText'])
    
    extracted_text = ' '.join(parsed_text)
    print(f"Extracted Text:\n{extracted_text}\n")  # 디버깅: OCR로 추출된 텍스트
    
    return extracted_text

def load_patterns(file_path='patterns.json'):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def load_corrections(file_path='corrections.json'):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def apply_corrections(text, corrections):
    for incorrect, correct in corrections.items():
        text = text.replace(incorrect, correct)
    return text

def refine_text(text, patterns, corrections):
    # OCR 수정 적용
    text = apply_corrections(text, corrections)

    refined_results = {
        'part': [],
        'name': [],
        'default_option': [],
        'up_jamje': [],
        'down_jamje': [],
        'soul': []
    }

    def apply_patterns(section_text, pattern_list, category):
        for pattern in pattern_list:
            # 수정된 정규 표현식 패턴
            regex_pattern = rf'{re.escape(pattern)}\s*:\s*([+-]?\d+(?:%|초)?)(?:\s*\(.*?\))?'
            matches = re.findall(regex_pattern, section_text)
            for match in matches:
                refined_results[category].append(f'{pattern}: {match}')
            
            # 콜론 없이 플러스 기호와 함께
            regex_pattern_no_colon = rf'{re.escape(pattern)}\s*([+-]?\d+(?:%|초)?)(?:\s*\(.*?\))?'
            matches_no_colon = re.findall(regex_pattern_no_colon, section_text)
            for match in matches_no_colon:
                refined_results[category].append(f'{pattern}: {match}')

    for category, names in patterns['name'].items():
        for name in names:
            if name in text:
                # Clear the list before appending the new value
                refined_results['name'].clear()
                refined_results['part'].clear()
                
                refined_results['name'].append(name)
                refined_results['part'].append(category)


    sections = {
        'default_option': (r'분류', r'잠재옵션'),
        'up_jamje': (r'잠재옵션', r'에디셔널 잠재옵션'),
        'down_jamje': (r'에디셔널 잠재옵션', r'소울 적용'),
        'soul': (r'소울 적용', None)
    }

    for category, (start_pattern, end_pattern) in sections.items():
        section_start = re.search(start_pattern, text)
        section_end = re.search(end_pattern, text) if end_pattern else None
        section_text = text

        if section_start:
            start_idx = section_start.end()
            if section_end:
                end_idx = section_end.start()
                section_text = text[start_idx:end_idx]
            else:
                section_text = text[start_idx:]

            apply_patterns(section_text, patterns[category], category)

    return refined_results

def load_blacklisted_images(folder='blacklist'):
    """
    블랙리스트 폴더 내의 모든 이미지를 로드합니다.
    """
    blacklisted_images = []
    
    # 현재 작업 디렉터리와의 상대 경로로 폴더를 로드합니다.
    current_dir = os.path.dirname(__file__)
    blacklist_folder_path = os.path.join(current_dir, folder)
    
    # blacklist 폴더 내의 모든 파일을 반복하며 이미지를 로드합니다.
    for filename in os.listdir(blacklist_folder_path):
        file_path = os.path.join(blacklist_folder_path, filename)
        image = cv2.imread(file_path)
        if image is not None:
            blacklisted_images.append(image)
    
    return blacklisted_images

def calculate_image_similarity(img1, img2):
    """
    Calculate the similarity between two images using dhash.
    """
    def dhash_image(image, hash_size=8):
        """Compute the dhash of an image using the given hash size."""
        image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        return dhash(image, hash_size)
    
    # Compute dhash for both images
    hash1 = dhash_image(img1)
    hash2 = dhash_image(img2)

    # Compute the Hamming distance between the two hashes
    dist = bin(hash1 ^ hash2).count('1')

    # Compute similarity ratio (lower distance means more similarity)
    similarity = 1 - (dist / max(len(bin(hash1)) - 2, 1))

    return similarity

def get_timestamp():
    """
    현재 날짜와 시간을 'YYYYMMDD_HHMMSS' 형식으로 반환합니다.
    """
    now = datetime.now()
    utc_plus_9 = now + timedelta(hours=9)  # UTC 시간에 9시간을 더합니다.
    return utc_plus_9.strftime('%Y%m%d_%H%M%S')

def process_image(image_path, processed_folder, item_images_folder, blacklist_folder='blacklist', threshold_value1=50, threshold_value2=80):
    # 블랙리스트 폴더 내의 모든 이미지 로드
    blacklisted_images = load_blacklisted_images(blacklist_folder)

    # 원본 이미지 읽기
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 1. 아이템 영역 탐색 및 분리
    _, initial_thresh = cv2.threshold(gray, threshold_value1, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(initial_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 컨투어를 x좌표를 기준으로 정렬
    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[0])
    
    item_images_paths = []
    item_images = []

    # 아이템 영역 찾기 플래그
    found_item_region = False

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        # 단 하나의 영역만 선택 (가장 왼쪽)
        if 300 > w > 200 and h > 400:
            item_image = image[y:y + h, x:x + w]
            
            # 블랙리스트 폴더 내의 모든 이미지와 유사도 비교
            for blacklisted_image in blacklisted_images:
                similarity = calculate_image_similarity(item_image, blacklisted_image)
                if similarity < 0.75:  # 유사도가 75% 미만일 때만 처리
                    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    
                    timestamp = get_timestamp()
                    item_image_filename = f"item_{timestamp}.png"
                    item_image_path = os.path.join(item_images_folder, item_image_filename)
                    cv2.imwrite(item_image_path, item_image)
                    item_images_paths.append(item_image_filename)
                    item_images.append(item_image)
                    found_item_region = True
                    
                    # 가장 왼쪽의 영역을 처리한 후 루프 종료
                    break

    # 아이템 영역을 찾지 못했을 경우 전체 이미지가 조건에 맞는지 확인
    if not found_item_region:
        h, w = image.shape[:2]
        if 500 > w > 200:  # 이미지의 너비가 200 이상 300 이하인 경우
            print("아이템 영역을 찾지 못했으나, 전체 이미지를 아이템 영역으로 간주합니다.")
            timestamp = get_timestamp()
            unique_filename = f"item_{timestamp}.png"
            item_image_path = os.path.join(item_images_folder, unique_filename)
            cv2.imwrite(item_image_path, image)  # 전체 이미지를 저장
            item_images_paths.append(unique_filename)
            item_images.append(image)
        else:
            print("아이템 영역을 찾지 못했고, 전체 이미지도 조건에 맞지 않습니다.")

    # 2. 색상 대체
    color_names = ['#FF0066', '#66FFFF', '#9966FF', '#FFCC00', '#CCFF00']
    replacement_color = '#FFFFFF'
    processed_item_images = []
    for item_image in item_images:
        replaced_image = replace_color_in_image(item_image.copy(), color_names, replacement_color)
        
        timestamp = get_timestamp()
        processed_image_filename = f"processed_{timestamp}.png"
        processed_image_path = os.path.join(processed_folder, processed_image_filename)
        cv2.imwrite(processed_image_path, replaced_image)
        processed_item_images.append(replaced_image)

    # 3. 이진화 처리
    binarized_images_paths = []
    for processed_image in processed_item_images:
        gray_processed = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
        _, binarized_image = cv2.threshold(gray_processed, threshold_value2, 255, cv2.THRESH_BINARY_INV)
        
        timestamp = get_timestamp()
        binarized_image_filename = f"binarized_{timestamp}.png"
        binarized_image_path = os.path.join(processed_folder, binarized_image_filename)
        cv2.imwrite(binarized_image_path, binarized_image)
        binarized_images_paths.append(binarized_image_path)

    # 4. OCR 처리 및 텍스트 정제
    patterns = load_patterns()  # 패턴 파일 읽기
    corrections = load_corrections()  # 교정 파일 읽기
    item_texts = []
    refined_results = {
        'part' : [],
        'name': [],
        'default_option': [],
        'up_jamje': [],
        'down_jamje': [],
        'soul': []
    }
    for binarized_image_path in binarized_images_paths:
        item_text = clova_ocr(binarized_image_path)
        refined_text = refine_text(item_text, patterns, corrections)  # 수정: corrections 인자 추가
        item_texts.append(refined_text)
        # 각 이미지의 정제된 텍스트를 results에 추가
        for key in refined_text:
            refined_results[key].extend(refined_text[key])

    # 최종 이미지 저장
    processed_image_filename = f"processed_{get_timestamp()}.png"
    processed_image_path = os.path.join(processed_folder, processed_image_filename)
    cv2.imwrite(processed_image_path, image)

    # 콘솔에 refined_results 출력
    print("Refined Results:")
    for category, items in refined_results.items():
        print(f"{category}:")
        for item in items:
            print(f"  {item}")

    return {
        'processed_image': processed_image_filename,
        'item_images': item_images_paths,
        'refined_results': refined_results
    }
