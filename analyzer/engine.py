from recon.basic_recon import basic_recon
from crawler.endpoint_crawler import EndpointCrawler
from analyzer.js_endpoint_extractor import JSEndpointExtractor
from analyzer.surface_mapper import AttackSurfaceMapper
from analyzer.parameter_discovery import ParameterDiscovery
from analyzer.vulnerability_scanner import VulnerabilityScanner
from analyzer.parameter_fuzzer import ParameterFuzzer
from analyzer.risk_engine import RiskEngine
from analyzer.idor_scanner import IDORScanner


def run_scan(target: str):
    print(f"[+] Starting full scan on {target}")

    # 1. Basic Recon
    recon_data = basic_recon(target)

    # 2. Crawler (Limit to 3 pages to avoid hanging)
    crawler = EndpointCrawler(target, max_pages=3)
    endpoints = crawler.crawl()

    # 3. JS Endpoint Extractor
    js_extractor = JSEndpointExtractor(target)
    js_endpoints = js_extractor.run(endpoints)
    all_endpoints = endpoints.union(js_endpoints)

    # 4. Attack Surface Mapping
    mapper = AttackSurfaceMapper()
    surface = mapper.correlate(endpoints, js_endpoints)

    # 5. Parameter Discovery
    param_desc = ParameterDiscovery()
    params = param_desc.run(all_endpoints)

    # Vulnerabilities to collect
    findings_list = []
    seen = set()

    # 6. Vulnerability Scanner (SQLi, XSS, etc.)
    vuln_scanner = VulnerabilityScanner()
    # We will pass a subset of endpoints with params to test
    vuln_results = vuln_scanner.test(params)

    for url, findings in vuln_results.items():
        for vuln, param, payload, evidence in findings:
            key = (vuln, url, param)
            if key in seen:
                continue
            seen.add(key)
            
            # Simplified risk assignment for now
            final_risk = "CRITICAL" if vuln == "SQLi" else "HIGH"
            
            findings_list.append({
                "risk": final_risk,
                "vuln": vuln,
                "url": url,
                "param": param,
                "payload": payload,
                "evidence": evidence
            })

    # 7. IDOR Scanner
    idor = IDORScanner()
    for url, p in params.items():
        idor_findings = idor.test(url, p)

        for f in idor_findings:
            key = ("IDOR", url, f["param"])
            if key in seen:
                continue
            seen.add(key)

            findings_list.append({
                "risk": "CRITICAL",
                "vuln": "IDOR",
                "url": url,
                "param": f["param"],
                "payload": f"{f['from']} -> {f['to']}",
                "evidence": f["evidence"]
            })

    print(f"[+] Scan completed for {target}. Found {len(findings_list)} vulnerabilities.")

    return {
        "target": target,
        "surface_map": surface,
        "findings": findings_list
    }