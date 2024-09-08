import os

def rename_images_in_folder(folder_path):
    # 폴더 내 파일 목록을 가져옵니다.
    files = os.listdir(folder_path)
    
    # 이미지 파일만 필터링합니다. (예: .jpg, .png, .jpeg 등)
    image_files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))]
    
    # 이미지 파일들을 정렬합니다.
    image_files.sort()

    # 파일명을 변경합니다.
    for index, filename in enumerate(image_files):
        # 새로운 파일명 생성 (img_1, img_2, ...)
        new_name = f"img_{index + 1}{os.path.splitext(filename)[1]}"
        # 기존 파일 경로와 새로운 파일 경로 생성
        src = os.path.join(folder_path, filename)
        dst = os.path.join(folder_path, new_name)
        # 파일명 변경
        os.rename(src, dst)
        print(f'Renamed: {src} -> {dst}')

# 이미지가 들어있는 폴더 경로를 지정합니다.
folder_path = "./image"
rename_images_in_folder(folder_path)
