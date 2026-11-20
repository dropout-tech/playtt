"""Read only the private rebuild bucket; private object metadata stays local.

Fetches JSON metadata roots/manifests only, never WordPress content or ZIPs.
No mutation API or deletion path exists in this tool. A listing is not an
atomic snapshot; compare listings and live coordinator before any future GC.
"""
import argparse
import datetime as dt
import json
import pathlib
import tomllib
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ACCOUNT = "3baadbd4abd9fd63c7f7e51664b26f67"
BUCKET = "playtt-wordpress-rebuild-audit"
ROOT = "sites/default/"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    parser.add_argument("--list-only", action="store_true", help="Skip JSON roots; suitable for capacity totals, not retention planning")
    args = parser.parse_args()
    token = tomllib.loads(args.config.read_text(encoding="utf-8"))["oauth_token"]
    base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects"

    def read(suffix):
        req = urllib.request.Request(base + suffix, headers={"Authorization": "Bearer " + token}, method="GET")
        with urllib.request.urlopen(req, timeout=45) as response:
            payload = response.read(2 * 1024 * 1024 + 1)
        if len(payload) > 2 * 1024 * 1024:
            raise ValueError("Metadata response exceeded budget")
        return json.loads(payload)

    objects, cursor, seen = [], None, set()
    for _ in range(100):
        params = {"per_page": 1000}
        if cursor:
            params["cursor"] = cursor
        page = read("?" + urllib.parse.urlencode(params))
        if not page.get("success") or not isinstance(page.get("result"), list):
            raise ValueError("Invalid object listing")
        for obj in page["result"]:
            key = obj["key"]
            if key in seen:
                raise ValueError("Duplicate listing key; inventory cannot be used")
            seen.add(key)
            objects.append({field: obj.get(field) for field in ("key", "size", "etag", "last_modified", "storage_class")})
        info = page.get("result_info", {})
        print(json.dumps({"pageObjects": len(page["result"]), "paginationFields": list(info), "hasCursor": bool(info.get("cursor")), "isTruncated": info.get("is_truncated")}), flush=True)
        if info.get("is_truncated") is False or (not info and len(page["result"]) < 1000):
            break
        if not info.get("cursor") or cursor == info["cursor"]:
            raise ValueError("Listing pagination incomplete")
        cursor = info["cursor"]
    else:
        raise ValueError("Inventory exceeded 100 pages")
    records = {}
    prefixes = (ROOT + "markdown/revisions/", ROOT + "publications/revisions/", ROOT + "publications/jobs/")
    current = (ROOT + "markdown/current.json", ROOT + "publications/current.json")
    metadata_keys = []
    for obj in objects:
        key = obj["key"]
        if key in current or (key.startswith(prefixes) and key.endswith(".json")):
            if obj["size"] > 256 * 1024:
                raise ValueError("Manifest exceeded budget")
            metadata_keys.append(key)
    def read_metadata(key):
        return key, read("/" + urllib.parse.quote(key, safe=""))
    if not args.list_only:
        with ThreadPoolExecutor(max_workers=4) as pool:
            records = dict(pool.map(read_metadata, metadata_keys))
    result = {"schema": "playtt/private-capacity-inventory/v1", "at": dt.datetime.now(dt.timezone.utc).isoformat(),
              "bucket": BUCKET, "completeListing": True, "atomicSnapshot": False, "metadataIncluded": not args.list_only,
              "objects": objects, "records": records}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    groups = {}
    for obj in objects:
        parts = obj["key"].split("/")
        category = "/".join(parts[:4]) if len(parts) > 4 else "/".join(parts[:-1])
        group = groups.setdefault(category, {"objects": 0, "bytes": 0})
        group["objects"] += 1
        group["bytes"] += obj["size"]
    print(json.dumps({"at": result["at"], "bucket": BUCKET, "objects": len(objects), "metadataRecords": len(records), "groups": groups}))


if __name__ == "__main__":
    main()
