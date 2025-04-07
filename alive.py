import requests
import re
import csv
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def clean_url(url):
    url = url.strip().replace('"', '')
    url = re.sub(r'[ㄱ-ㅎㅏ-ㅣ가-힣]', '', url)
    return url

def get_status(url):
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla'}, timeout=5, verify=False)
        return str(res.status_code)
    except requests.exceptions.RequestException:
        return 'X'

with open('url_list.txt', 'r', encoding='utf-8') as fr, open('result2.csv', 'w', newline='', encoding='utf-8') as fw:
    writer = csv.writer(fw)
    writer.writerow(['Domain', 'HTTP Status', 'HTTPS Status'])

    for line in fr:
        raw = clean_url(line)
        if not raw:
            continue

        domain = re.sub(r'^https?://', '', raw)
        url_http = 'http://' + domain
        url_https = 'https://' + domain

        status_http = get_status(url_http)
        status_https = get_status(url_https)

        writer.writerow([domain, status_http, status_https])
        print(f"{domain} | [{status_http}] [{status_https}]")