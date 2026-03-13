class ParameterFuzzer:
    def __init__(self):
        # Common parameter names used in real-world web apps
        self.common_params = [
            "id", "q"
        ]

    def generate(self, endpoints):
        fuzzed_urls = set()
        count = 0

        for ep in endpoints:
            if "php" in ep or "api" in ep:
                for param in self.common_params:
                    fuzzed_urls.add(f"{ep}?{param}=1")
                    count += 1
                    if count >= 5: return fuzzed_urls

        return fuzzed_urls
