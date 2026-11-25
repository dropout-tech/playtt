"""Read-only R2 capacity evidence. Never prints or saves OAuth credentials.

Refresh the existing project Wrangler login before use. Output includes account
aggregates (shared allowance) and only bucket names beginning with playtt-.
This is analytics evidence, not an invoice or a hard spending cap.
"""
import argparse
import datetime as dt
import json
import pathlib
import tomllib
import urllib.error
import urllib.request

ACCOUNT = "3baadbd4abd9fd63c7f7e51664b26f67"
API = "https://api.cloudflare.com/client/v4"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    parser.add_argument("--start", required=True, help="Explicit UTC start, at most 31 days ago")
    args = parser.parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    start = dt.datetime.fromisoformat(args.start.replace("Z", "+00:00"))
    if start.tzinfo is None or not dt.timedelta(0) < now - start <= dt.timedelta(days=31):
        raise ValueError("Require a past UTC start within 31 days")
    token = tomllib.loads(args.config.read_text(encoding="utf-8"))["oauth_token"]

    def request(path, query=None):
        if path != "/graphql" and path not in (f"/accounts/{ACCOUNT}/r2/metrics", f"/accounts/{ACCOUNT}/r2/buckets"):
            raise ValueError("Read endpoint not allowlisted")
        payload = json.dumps(query).encode() if query is not None else None
        req = urllib.request.Request(API + path, data=payload, headers={
            "Authorization": "Bearer " + token, "Content-Type": "application/json",
        }, method="POST" if payload is not None else "GET")
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.load(response)
        except urllib.error.HTTPError as error:
            return {"httpStatus": error.code, "available": False}
        if result.get("errors"):
            return {"available": False, "errorCodes": [e.get("code", e.get("extensions", {}).get("code")) for e in result["errors"]]}
        return result

    report = {"schema": "playtt/r2-capacity-observation/v1", "at": now.isoformat(),
              "range": {"from": start.isoformat(), "to": now.isoformat()},
              "source": "Cloudflare authenticated REST + GraphQL, read-only",
              "accountMetrics": request(f"/accounts/{ACCOUNT}/r2/metrics"),
              "limitations": ["Analytics may lag; account aggregates include other projects.",
                               "Not an invoice, billing-period confirmation, forecast, or spending cap."]}
    listing = request(f"/accounts/{ACCOUNT}/r2/buckets")
    buckets = sorted(b["name"] for b in listing.get("result", {}).get("buckets", []) if b["name"].startswith("playtt-"))
    if not buckets:
        report["bucketListing"] = {"available": False}
    fields = []
    for i, bucket in enumerate(buckets):
        fields.append(f'''b{i}: r2StorageAdaptiveGroups(limit: 1, filter: {{datetime_geq: $recent, datetime_leq: $end, bucketName: {json.dumps(bucket)}}}, orderBy: [datetime_DESC]) {{ max {{ objectCount payloadSize metadataSize }} dimensions {{ datetime }} }}''')
        fields.append(f'''o{i}: r2OperationsAdaptiveGroups(limit: 100, filter: {{datetime_geq: $start, datetime_leq: $end, bucketName: {json.dumps(bucket)}}}) {{ sum {{ requests }} dimensions {{ actionType }} }}''')
    fields.append('''accountOperations: r2OperationsAdaptiveGroups(limit: 100, filter: {datetime_geq: $start, datetime_leq: $end}) { sum { requests } dimensions { actionType } }''')
    query = '''query Capacity($account: String, $start: Time, $recent: Time, $end: Time) { viewer { accounts(filter: {accountTag: $account}) {''' + "\n".join(fields) + "} } }"
    result = request("/graphql", {"query": query, "variables": {"account": ACCOUNT, "start": start.isoformat(), "recent": (now - dt.timedelta(days=1)).isoformat(), "end": now.isoformat()}})
    accounts = result.get("data", {}).get("viewer", {}).get("accounts", []) if result.get("data") else []
    if accounts:
        data = accounts[0]
        report["buckets"] = [{"name": bucket, "latestStorage": data[f"b{i}"], "operations": data[f"o{i}"]} for i, bucket in enumerate(buckets)]
        report["accountOperations"] = data["accountOperations"]
    else:
        report["graphql"] = result
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
