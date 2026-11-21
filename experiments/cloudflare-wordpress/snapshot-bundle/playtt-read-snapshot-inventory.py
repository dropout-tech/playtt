"""Read only one explicitly allowed private playtt bucket; metadata stays local.

Fetches JSON metadata roots/manifests only, never WordPress content or ZIPs.
No mutation API or deletion path exists in this tool. A listing is not an
atomic snapshot; compare listings and live coordinator before any future GC.
"""
import argparse
import base64
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
    parser.add_argument("--bucket", choices=[BUCKET, "playtt-wordpress-pin-restore-audit"], default=BUCKET)
    parser.add_argument("--all-publication-metadata", action="store_true", help="Include progress, claims and receipts for reference analysis; not the older retention-planner profile")
    parser.add_argument("--include-raw-manifests", action="store_true", help="Retain exact raw manifest bytes for overlay dependency hashes; private output only")
    args = parser.parse_args()
    if args.include_raw_manifests and not args.all_publication_metadata:
        parser.error("--include-raw-manifests requires --all-publication-metadata")
    if args.include_raw_manifests and args.list_only:
        parser.error("--include-raw-manifests cannot be combined with --list-only")
    token = tomllib.loads(args.config.read_text(encoding="utf-8"))["oauth_token"]
    base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/r2/buckets/{args.bucket}/objects"

    def read(suffix, with_raw=False):
        req = urllib.request.Request(base + suffix, headers={"Authorization": "Bearer " + token}, method="GET")
        with urllib.request.urlopen(req, timeout=45) as response:
            payload = response.read(2 * 1024 * 1024 + 1)
        if len(payload) > 2 * 1024 * 1024:
            raise ValueError("Metadata response exceeded budget")
        value = json.loads(payload)
        return (value, payload) if with_raw else value

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
    records, raw_manifest_bytes = {}, {}
    prefixes = (ROOT + "markdown/revisions/", ROOT + "publications/revisions/", ROOT + "publications/jobs/")
    if args.all_publication_metadata:
        prefixes += tuple(ROOT + "publications/" + part + "/" for part in ["job-progress", "job-claims", "job-receipts"])
    current = (ROOT + "markdown/current.json", ROOT + "publications/current.json")
    metadata_keys = []
    for obj in objects:
        key = obj["key"]
        if key in current or (key.startswith(prefixes) and key.endswith(".json")):
            if obj["size"] > 256 * 1024:
                raise ValueError("Manifest exceeded budget")
            metadata_keys.append(key)
    object_sizes = {item["key"]: item["size"] for item in objects}
    def read_metadata(key):
        value, raw = read("/" + urllib.parse.quote(key, safe=""), with_raw=True)
        if len(raw) != object_sizes[key] or len(raw) > 256 * 1024:
            raise ValueError("Metadata changed size or exceeded its budget")
        return key, value, raw
    if not args.list_only:
        total_raw = 0
        with ThreadPoolExecutor(max_workers=4) as pool:
            for key, value, raw in pool.map(read_metadata, metadata_keys):
                records[key] = value
                if args.include_raw_manifests and key.startswith(ROOT + "markdown/revisions/"):
                    total_raw += len(raw)
                    if total_raw > 64 * 1024 * 1024:
                        raise ValueError("Raw manifest inventory exceeded its aggregate budget")
                    raw_manifest_bytes[key] = base64.b64encode(raw).decode("ascii")
    result = {"schema": "playtt/private-capacity-inventory/v1", "at": dt.datetime.now(dt.timezone.utc).isoformat(),
              "bucket": args.bucket, "completeListing": True, "atomicSnapshot": False, "metadataIncluded": not args.list_only,
              "metadataProfile": "references-overlay-v1" if args.include_raw_manifests else ("references-v1" if args.all_publication_metadata else "retention-v1"),
              "objects": objects, "records": records}
    if args.include_raw_manifests:
        result["rawManifestBytes"] = raw_manifest_bytes
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    groups = {}
    for obj in objects:
        parts = obj["key"].split("/")
        category = "/".join(parts[:4]) if len(parts) > 4 else "/".join(parts[:-1])
        group = groups.setdefault(category, {"objects": 0, "bytes": 0})
        group["objects"] += 1
        group["bytes"] += obj["size"]
    print(json.dumps({"at": result["at"], "bucket": args.bucket, "objects": len(objects), "metadataRecords": len(records), "groups": groups}))


if __name__ == "__main__":
    main()
