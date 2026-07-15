import logging

from analyzer.idor_scanner import IDORScanner
from analyzer.js_endpoint_extractor import JSEndpointExtractor
from analyzer.parameter_discovery import ParameterDiscovery
from analyzer.risk_engine import RiskEngine
from analyzer.surface_mapper import AttackSurfaceMapper
from analyzer.vulnerability_scanner import VulnerabilityScanner
from config import settings
from crawler.endpoint_crawler import EndpointCrawler
from recon.basic_recon import basic_recon

logger = logging.getLogger("civicshield.engine")


def run_scan(target: str) -> dict:
    """Run the full scan pipeline against a (already SSRF-validated) target.

    Returns {target, surface_map, findings[]} where each finding is
    {risk, vuln, url, param, payload, evidence}.
    """
    logger.info("Starting scan on %s", target)

    # 1. Recon
    basic_recon(target)

    # 2. Crawl (page cap keeps scans bounded)
    crawler = EndpointCrawler(target, max_pages=settings.scan_max_pages)
    endpoints = crawler.crawl()

    # 3. JS endpoint extraction
    js_extractor = JSEndpointExtractor(target)
    js_endpoints = js_extractor.run(endpoints)
    all_endpoints = endpoints.union(js_endpoints)

    # 4. Attack-surface mapping (also used to weight risk per endpoint)
    mapper = AttackSurfaceMapper()
    surface = mapper.correlate(endpoints, js_endpoints)

    # 5. Parameter discovery
    params = ParameterDiscovery().run(all_endpoints)

    findings_list = []
    seen = set()
    risk_engine = RiskEngine()

    def endpoint_risk(url: str) -> str:
        entry = surface.get(url)
        if entry:
            return entry.get("risk", "LOW")
        return mapper.tag_endpoint(url)

    # 6. Vulnerability scanning (SQLi / XSS)
    vuln_results = VulnerabilityScanner().test(params)
    for url, findings in vuln_results.items():
        for vuln, param, payload, evidence in findings:
            key = (vuln, url, param)
            if key in seen:
                continue
            seen.add(key)

            # Score using the endpoint's surface risk + the vuln type, instead
            # of a hardcoded label.
            score = risk_engine.score(endpoint_risk(url), vuln)
            findings_list.append(
                {
                    "risk": risk_engine.label(score),
                    "vuln": vuln,
                    "url": url,
                    "param": param,
                    "payload": payload,
                    "evidence": evidence,
                }
            )

    # 7. IDOR scanning
    idor = IDORScanner()
    for url, p in params.items():
        for f in idor.test(url, p):
            key = ("IDOR", url, f["param"])
            if key in seen:
                continue
            seen.add(key)
            findings_list.append(
                {
                    "risk": "CRITICAL",
                    "vuln": "IDOR",
                    "url": url,
                    "param": f["param"],
                    "payload": f"{f['from']} -> {f['to']}",
                    "evidence": f["evidence"],
                }
            )

    logger.info("Scan completed for %s: %d findings", target, len(findings_list))
    return {"target": target, "surface_map": surface, "findings": findings_list}
