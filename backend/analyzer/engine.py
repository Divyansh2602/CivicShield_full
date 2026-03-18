from recon.basic_recon import basic_recon
from crawler.endpoint_crawler import EndpointCrawler
from analyzer.js_endpoint_extractor import JSEndpointExtractor
from analyzer.surface_mapper import AttackSurfaceMapper
from analyzer.parameter_discovery import ParameterDiscovery
from analyzer.vulnerability_scanner import VulnerabilityScanner
from analyzer.idor_scanner import IDORScanner
from analyzer.passive_security_analyzer import PassiveSecurityAnalyzer


STAGES = {
    "recon": 15,
    "crawl": 30,
    "js_analysis": 45,
    "surface_map": 55,
    "param_discovery": 70,
    "vulnerability_scan": 85,
    "idor_scan": 93,
    "complete": 100,
}


def run_scan(target: str, progress_callback=None):
    print(f"[+] Starting full scan on {target}")

    def emit(stage, message, stats=None):
        if progress_callback:
            progress_callback(
                stage=stage,
                percent=STAGES[stage],
                message=message,
                stats=stats or {},
            )

    emit("recon", "Running target reconnaissance")
    recon_data = basic_recon(target)

    emit("crawl", "Crawling internal pages and links")
    crawler = EndpointCrawler(target, max_pages=3)
    endpoints = crawler.crawl()

    emit("js_analysis", "Extracting endpoints from JavaScript assets", {
        "pages_crawled": len(crawler.visited),
        "html_endpoints": len(endpoints),
    })
    js_extractor = JSEndpointExtractor(target)
    js_endpoints = js_extractor.run(endpoints)
    all_endpoints = endpoints.union(js_endpoints)

    emit("surface_map", "Correlating attack surface and assigning endpoint risk", {
        "pages_crawled": len(crawler.visited),
        "html_endpoints": len(endpoints),
        "js_endpoints": len(js_endpoints),
        "total_endpoints": len(all_endpoints),
    })
    mapper = AttackSurfaceMapper()
    surface = mapper.correlate(endpoints, js_endpoints)

    emit("param_discovery", "Discovering GET and POST parameters", {
        "pages_crawled": len(crawler.visited),
        "total_endpoints": len(all_endpoints),
    })
    param_desc = ParameterDiscovery()
    params = param_desc.run(all_endpoints)
    total_params = sum(len(p) for p in params.values())

    findings_list = []
    seen = set()

    passive_analyzer = PassiveSecurityAnalyzer()
    passive_findings = passive_analyzer.analyze(target, all_endpoints)
    for finding in passive_findings:
        key = (finding["vuln"], finding["url"], finding.get("param", "-"), finding.get("signal"))
        if key in seen:
            continue
        seen.add(key)
        findings_list.append(finding)

    emit("vulnerability_scan", "Testing parameters for injection vulnerabilities", {
        "pages_crawled": len(crawler.visited),
        "html_endpoints": len(endpoints),
        "js_endpoints": len(js_endpoints),
        "total_endpoints": len(all_endpoints),
        "urls_with_params": len(params),
        "parameters_discovered": total_params,
        "passive_findings": len(passive_findings),
    })
    vuln_scanner = VulnerabilityScanner()
    vuln_results = vuln_scanner.test(params)

    for url, findings in vuln_results.items():
        for finding in findings:
            key = (finding["vuln"], url, finding["param"], finding.get("signal"))
            if key in seen:
                continue
            seen.add(key)
            findings_list.append(finding)

    emit("idor_scan", "Checking for direct object reference weaknesses", {
        "urls_with_params": len(params),
        "parameters_discovered": total_params,
        "payloads_tested": vuln_scanner.stats["payloads_tested"],
        "requests_made": vuln_scanner.stats["requests_made"],
        "confirmed_findings": len(findings_list),
        "passive_findings": len(passive_findings),
    })
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
                "evidence": f["evidence"],
                "method": "GET",
                "signal": "Object reference changed without authorization checks",
                "remediation": "Enforce object-level authorization checks on every resource access and avoid exposing sequential identifiers.",
            })

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    vuln_type_counts = {}
    for finding in findings_list:
        risk = str(finding.get("risk", "LOW")).lower()
        severity_counts[risk] = severity_counts.get(risk, 0) + 1
        vuln_name = finding.get("vuln", "Unknown")
        vuln_type_counts[vuln_name] = vuln_type_counts.get(vuln_name, 0) + 1

    summary = {
        "pages_crawled": len(crawler.visited),
        "html_endpoints": len(endpoints),
        "js_endpoints": len(js_endpoints),
        "total_endpoints": len(all_endpoints),
        "urls_with_params": len(params),
        "parameters_discovered": total_params,
        "payloads_tested": vuln_scanner.stats["payloads_tested"],
        "requests_made": vuln_scanner.stats["requests_made"],
        "confirmed_findings": len(findings_list),
        "passive_findings": len(passive_findings),
        "severity_counts": severity_counts,
        "vulnerability_types": vuln_type_counts,
        "high_risk_surface": sum(1 for item in surface.values() if item.get("risk") == "HIGH"),
        "medium_risk_surface": sum(1 for item in surface.values() if item.get("risk") == "MEDIUM"),
    }

    emit("complete", "Scan completed and report artifacts are ready", summary)

    print(f"[+] Scan completed for {target}. Found {len(findings_list)} vulnerabilities.")

    return {
        "target": target,
        "recon": recon_data,
        "surface_map": surface,
        "summary": summary,
        "findings": findings_list,
    }
