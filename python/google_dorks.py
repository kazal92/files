import os
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
import urllib3

urllib3.disable_warnings()

# SSL 인증서 검증 해제
os.environ['WDM_SSL_VERIFY'] = '0'

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
PROXY = "127.0.0.1:8080"

chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--ignore-certificate-errors")
chrome_options.add_argument("--allow-running-insecure-content")
chrome_options.add_argument("--log-level=1")
chrome_options.add_argument(f"user-agent={USER_AGENT}")  # User-Agent 변경
# chrome_options.add_argument(f"--proxy-server={PROXY}")  # Proxy 설정

google_driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=chrome_options)


# 검색할 쿼리 입력 (라인별로 실행)
query = """
intitle:index.of
filetype:sql | filetype:dbf | filetype:mdb | filetype:log | filetype:bkf | filetype:bkp | filetype:bak | filetype:old | filetype:backup
inurl:login OR inurl:admin OR inurl:user OR inurl:cpanel OR inurl:account OR inurl:moderator OR inurl:/cp OR inurl:Backoffice OR inurl:webmanage OR inurl:site_control OR inurl:manage OR inurl:wp-login OR inurl:rhksflwk OR inurl:shadow_admin OR inurl:adm OR inurl:djemals
intext:"sql syntax near" | intext:"syntax error has occurred" | intext:"incorrect syntax near" | intext:"unexpected end of SQL command" | intext:"Warning: mysql_connect()" | intext:"Warning: mysql_query()" | intext:"Warning: pg_connect()" | intext:"Warning: mysql_num_rows()"  | intext:"Warning: filesize()"
numrange:500101-991231
intext:"010" | "011" | "017" | "019"
intext:@lgcarepartner.com | intext:@efusioni.com | intext:@ccbkpartner.co.kr | intext:@claster.co.kr | intext:@thefaceshop.com | intext:@lghnh.com | intext:@htb.co.kr | intext:@cnpcosmetics.com | intext:@ccbk.co.kr | intext:@htbpartner.co.kr | intext:@tfspartner.com | intext:@ultion.co.kr | intext:@nexlink.co.kr | intext:@lgcns.com | intext:@cnpcosmetics.com | intext:@jiran.com | intext:@behaveglobal.com | intext:@hankooktech.com | intext:@saehimit.com | intext:@outlook.com | intext:@outlook.kr | intext:@daum.net | intext:@gmail.com | intext:@hanmail.net | intext:@hotmail.com | intext:@naver.com | intext:@nate.com | intext:@yahoo.com | intext:@yahoo.co.kr
filetype:pdf | filetype:pptx | filetype:txt | filetype:back | filetype:hwp | filetype:docx | filetype:doc | filetype:xlsx | filetype:xls | filetype:xml | filetype:csv
"""

try:
    query_list = query.split('\n')

    try:
        # URLs 파일 읽기
        with open(r"C:\Users\LJH\Desktop\cleaned_domains.txt", 'r') as file:
            urls = [line.strip() for line in file if line.strip()]
    except FileNotFoundError:
        print("파일을 찾을 수 없습니다.")
        exit(1)

    test = input("하나씩 실행하시려면 y, 여러 개 실행하시려면 m : ")

    if test == 'y':
        for url in urls:
            input(f"{url} 실행 하시려면 아무 키나 눌러주세요")

            # Google 검색
            google_url = f"https://www.google.com/search?q=site:{url}"
            google_driver.execute_script(f"window.open('{google_url}');")

            input_data = input("상세 쿼리를 실행하려면 y를 입력하세요: ")
            if input_data == 'y':
                for query in query_list:
                    if query.strip():
                        google_url_detail = f"https://www.google.com/search?q=site:{url} {query}"
                        google_driver.execute_script(f"window.open('{google_url_detail}');")

    elif test == 'm':
        current_index = 0
        google_url = f"https://www.google.com/search?q=site:naver.com" # 캡챠 띄워서 풀고 난 다음 실행

        while True:
            num = int(input("연속해서 실행할 URL 개수를 입력하세요 : "))
            end_index = current_index + num
            for url in urls[current_index:end_index]:
                print(f"load URL : {url}")
                for query in query_list:
                    if query != (''):
                        google_url_detail = f"https://www.google.com/search?q=site:{url} {query}"
                        google_driver.execute_script(f"window.open('{google_url_detail}');")

            current_index = end_index

            if current_index >= len(urls):
                print("모든 검색이 완료되었습니다.")
                break

    input("엔터를 누르시면 브라우저가 종료됩니다.")

finally:
    google_driver.quit()
