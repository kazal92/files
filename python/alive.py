import requests
import csv
import re
import urllib3

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def clean_url(url):
    """URL 문자열 정리 및 한글 제거"""
    url = url.strip().replace('"', '')
    return url.rstrip('/')

def get_status_trace_and_redirect(url):
    """리다이렉트 상태 추적 및 첫 리다이렉트 URL 반환"""
    try:
        response = requests.get(
            url,
            headers={'User-Agent': 'Mozilla'},
            timeout=5,
            verify=False,
            allow_redirects=True
        )
        trace = [res.status_code for res in response.history]
        trace.append(response.status_code)

        first_redirect_url = (
            response.history[0].headers.get('Location')
            if response.history else '-'
        )

        return trace, first_redirect_url
    except requests.exceptions.RequestException:
        return ['X'], '-'

with open('url_list.txt', 'r', encoding='utf-8') as fr, \
     open('result2.csv', 'w', newline='', encoding='utf-8') as fw:

    writer = csv.writer(fw)
    writer.writerow(['O/X', 'Domain', 'HTTP Redirect URL', 'HTTPS Redirect URL', 'HTTP Status', 'HTTPS Status'])

    for count, line in enumerate(fr, 1):
        domain_raw = clean_url(line)
        if not domain_raw:
            continue

        domain = re.sub(r'^https?://', '', domain_raw)
        http_url = f'http://{domain}'
        https_url = f'https://{domain}'

        http_trace, http_redirect_url = get_status_trace_and_redirect(http_url)
        https_trace, https_redirect_url = get_status_trace_and_redirect(https_url)

        last_http = str(http_trace[-1])
        last_https = str(https_trace[-1])

        ox = 'O' if last_http.startswith('2') or last_https.startswith('2') else 'X'

        http_trace_str = ' > '.join(map(str, http_trace))
        https_trace_str = ' > '.join(map(str, https_trace))

        writer.writerow([ox, domain, http_redirect_url, https_redirect_url, http_trace_str, https_trace_str])

        print(f"{count:>3} | {ox} | {domain.ljust(70)} | HTTP: {last_http:^3} | HTTPS: {last_https:^3} |")
