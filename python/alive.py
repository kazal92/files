import requests
import re
import urllib3
import pandas as pd
from urllib.parse import urljoin
import ssl
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class LegacyTLSAdapter(HTTPAdapter):
    """구형 SSL/TLS 및 취약한 암호화 알고리즘을 지원하기 위한 커스텀 어댑터"""
    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        ctx = create_urllib3_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.options |= getattr(ssl, 'OP_LEGACY_SERVER_CONNECT', 0x4)
        # 하위 호환성을 위해 보안 레벨을 낮춤 (OpenSSL 3.0+ 환경에서 구형 서버 접속 시 필요)
        try:
            ctx.set_ciphers('DEFAULT@SECLEVEL=0')
        except Exception:
            pass
        pool_kwargs['ssl_context'] = ctx
        super().init_poolmanager(connections, maxsize, block, **pool_kwargs)

def extract_js_meta_redirect(html_text):
    """HTML에서 Meta Refresh 또는 JS 기반 리다이렉트 URL 추출"""
    content = html_text.lower()
    
    meta_match = re.search(r'url=(["\']?)([^"\'>\s]+)\1', content)
    if meta_match:
        return meta_match.group(2)
    
    if 'location' in content:
        js_match = re.search(r'(?:window\.|document\.)?location(?:\.href|\.replace|\.assign)?\s*(?:=\s*|\()\s*(["\'])(.*?)\1', content)
        if js_match:
            return js_match.group(2)
            
    return None

def check_url(session, url):
    """해당 URL의 HTTP 상태 및 리다이렉트 경로를 추적하여 반환"""
    try:
        response = session.get(
            url, timeout=15, verify=False, allow_redirects=True
        )
        trace = [res.status_code for res in response.history] + [response.status_code]
        
        # 리다이렉트 여부와 상관없이 최종 접속된 실제 URL 무조건 기록
        final_url = response.url

        # JS / Meta 리다이렉트 연속 추적 (최대 2회)
        redirect_count = 0
        while response.status_code == 200 and redirect_count < 2:
            jump_path = extract_js_meta_redirect(response.text)
            if not jump_path:
                break
                
            jump_url = urljoin(response.url, jump_path)
            final_url = jump_url
            
            try:
                response = session.get(jump_url, timeout=15, verify=False, allow_redirects=True)
                trace.extend([res.status_code for res in response.history] + [response.status_code])
                final_url = response.url
                redirect_count += 1
            except requests.exceptions.RequestException:
                break

        # 강제 HTTPS 크로스체크 (HTTP로 남아있고 접속 성공한 경우)
        if final_url.startswith('http://') and response.status_code == 200:
            forced_https_url = final_url.replace('http://', 'https://', 1)
            try:
                check_res = session.get(forced_https_url, timeout=10, verify=False, allow_redirects=True)
                if check_res.status_code == 200:
                    final_url = check_res.url
            except requests.exceptions.RequestException:
                pass

        return trace, final_url
        
    except requests.exceptions.RequestException:
        return ['X'], '-'

def main():
    input_file = 'url_list_6.txt'
    output_excel = 'alive_check_260319__.xlsx'
    columns = ['O/X', 'Domain', 'HTTP Final URL', 'HTTPS Final URL', 'HTTP Status', 'HTTPS Status']
    
    # 세션 초기화 (재사용으로 성능 향상)
    session = requests.Session()
    session.mount('https://', LegacyTLSAdapter())
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    })

    results = []
    
    lines = []
    try:
        # 여러 인코딩을 순차적으로 시도하여 다국어 도메인 텍스트 깨짐 방지
        for enc in ['utf-8', 'utf-8-sig', 'cp949', 'euc-kr', 'shift_jis']:
            try:
                with open(input_file, 'r', encoding=enc) as f:
                    lines = [line.strip().replace('"', '').rstrip('/') for line in f if line.strip()]
                break
            except UnicodeDecodeError:
                continue
        if not lines:  # 모든 인코딩 해석 실패 시 강제로 읽기
            with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
                lines = [line.strip().replace('"', '').rstrip('/') for line in f if line.strip()]
    except FileNotFoundError:
        print(f"[!] {input_file} 파일을 찾을 수 없습니다.")
        return

    for count, domain_raw in enumerate(lines, 1):
        domain = re.sub(r'^https?://', '', domain_raw)
        
        http_trace, http_redirect_url = check_url(session, f'http://{domain}')
        https_trace, https_redirect_url = check_url(session, f'https://{domain}')

        last_http = str(http_trace[-1])
        last_https = str(https_trace[-1])
        ox = 'X' if last_http == 'X' and last_https == 'X' else 'O'

        http_trace_str = ' > '.join(map(str, http_trace))
        https_trace_str = ' > '.join(map(str, https_trace))

        results.append([ox, domain, http_redirect_url, https_redirect_url, http_trace_str, https_trace_str])
        
        if count % 10 == 0:
            pd.DataFrame(results, columns=columns).to_excel(output_excel, index=False)

        print(f"{count:>3} | {ox} | {domain.ljust(40)} | HTTP: {str(http_redirect_url).ljust(50)} | HTTPS: {str(https_redirect_url).ljust(50)} | H:{last_http:^3} S:{last_https:^3}")

    if results:
        pd.DataFrame(results, columns=columns).to_excel(output_excel, index=False)
        print(f"\n[+] 스캔 완료! 결과가 {output_excel}에 저장되었습니다.")

if __name__ == '__main__':
    main()
