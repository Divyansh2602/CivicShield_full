class AttackSurfaceMapper:
    def __init__(self):
        self.high_risk_keywords = [
            "admin", "login", "auth", "register",
            "password", "token"
        ]

        self.medium_risk_keywords = [
            "api", "v1", "v2", "user", "profile"
        ]

    def tag_endpoint(self, endpoint):
        ep = endpoint.lower()

        for word in self.high_risk_keywords:
            if word in ep:
                return "HIGH"

        for word in self.medium_risk_keywords:
            if word in ep:
                return "MEDIUM"

        return "LOW"

    def correlate(self, html_endpoints, js_endpoints):
        attack_surface = {}

        all_endpoints = set(html_endpoints) | set(js_endpoints)

        for ep in all_endpoints:
            attack_surface[ep] = {
                "risk": self.tag_endpoint(ep)
            }

        return attack_surface
