import requests

class IDORScanner:
    def __init__(self):
        self.id_params = ["id", "uid", "user", "user_id", "account"]

    def test(self, url, params):
        findings = []

        for param in params:
            if param not in self.id_params:
                continue

            try:
                r1 = requests.get(url, params={param: 1}, timeout=(2, 2))
                r2 = requests.get(url, params={param: 2}, timeout=(2, 2))

                if r1.text != r2.text and len(r1.text) > 50 and len(r2.text) > 50:
                    findings.append({
                        "param": param,
                        "from": 1,
                        "to": 2,
                        "evidence": r2.text[:120]
                    })
            except:
                pass

        return findings
