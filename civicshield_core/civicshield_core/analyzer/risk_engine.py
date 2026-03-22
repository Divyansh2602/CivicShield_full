class RiskEngine:
    def __init__(self):
        self.vuln_weights = {
            "SQLi": 5,
            "XSS": 3
        }

        self.endpoint_weights = {
            "HIGH": 5,
            "MEDIUM": 3,
            "LOW": 1
        }

    def score(self, endpoint_risk, vuln_type):
        return self.vuln_weights.get(vuln_type, 1) + self.endpoint_weights.get(endpoint_risk, 1)

    def label(self, score):
        if score >= 8:
            return "CRITICAL"
        elif score >= 6:
            return "HIGH"
        elif score >= 4:
            return "MEDIUM"
        return "LOW"
