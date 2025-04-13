import subprocess
import os
import time
from urllib.parse import urlparse

"""
1. ZAP Proxy Docker 이미지 설치
docker pull ghcr.io/zaproxy/zaproxy:stable

2. url_list.txt에 대상 URL 입력 후, 해당 경로에서 스크립트 실행
url_list.txt 예시:
https://example.com
https://google.com:8888/login.jsp

3. 스크립트가 위치한 디렉토리에서 실행
"""

url_list_file = "url_list.txt" 
output_dir = os.getcwd()  # 현재 디렉토리

with open(url_list_file, "r") as f:
    urls = [line.strip() for line in f if line.strip()]

for idx, url in enumerate(urls, start=1):
    parsed = urlparse(url)

    domain = parsed.hostname  # ex: naver.com
    port = parsed.port # ex: 8080
    path_tmp = parsed.path
    scheme = parsed.scheme
    path = path_tmp.replace('/', '_')
    
    if port:
        name =f"{scheme}_{domain}__{port}{path}" # ex: naver.com_8080
    else:
        name = f"{scheme}_{domain}{path}"    

    report_file = f"report_{name}.html"
    
    print(" ")
    print("=============================================")
    print(f"[{idx}] Scanning : {url}")
    print("---------------------------------------------")
    
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{output_dir}:/zap/wrk/:rw",  # 디렉터리 마운트
        "-t", "ghcr.io/zaproxy/zaproxy:stable", # 도커 이미지 선택
        "zap-full-scan.py", # 스크립트 선택 
        "-t", url, # 타겟 URL ex: https://google.com:8888/login.jsp
        "-m", "1", # 스파이더 시간
        "-T", "5", # 패시브스캔 최대 시간
        "-d", # 디버깅 출력
        "-c", "/zap/wrk/policy.conf", # 정책 설정(일부 스캔 뺄 용도)
        "-r", f"/zap/wrk/{report_file}" # 리포트 출력 파일일
    ]

    subprocess.run(cmd)
    time.sleep(5)