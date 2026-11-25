"""Offline retention proposal only. No network, cloud deletion or apply mode.

Protect current/publication/job/cache roots, verified local backup pins,
all revisions from the last 24 hours, the latest 20, and 7 UTC daily points.
Only retired manifests and their unshared packs can be proposed. Content
objects, media, themes, runtime archives and publication artifacts are excluded.
"""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re

BUCKET = "playtt-wordpress-rebuild-audit"
ROOT = "sites/default/"
MANIFESTS = ROOT + "markdown/revisions/"
PACKS = ROOT + "restore-packs/"
UUID = re.compile(r"[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def timestamp(value):
    date = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(date.tzinfo is not None, "Timestamp requires timezone")
    return date.astimezone(dt.timezone.utc)


def plan(inventory, pins, now, registry=None):
    require(inventory.get("schema") == "playtt/private-capacity-inventory/v1", "Unknown inventory schema")
    require(inventory.get("bucket") == BUCKET and inventory.get("completeListing") is True, "Incomplete or wrong-bucket inventory")
    objects = {}
    for obj in inventory["objects"]:
        key = obj["key"]
        require(isinstance(key, str) and key not in objects and ".." not in key.split("/") and "\\" not in key, "Invalid/duplicate object key")
        require(type(obj["size"]) is int and obj["size"] >= 0, "Invalid object size")
        objects[key] = obj
    records = inventory["records"]
    root_prefixes = (MANIFESTS, ROOT + "publications/revisions/", ROOT + "publications/jobs/")
    required_records = {k for k in objects if k.startswith(root_prefixes) or k in (ROOT + "markdown/current.json", ROOT + "publications/current.json")}
    require(set(records) == required_records, "Metadata root catalog incomplete or unrecognized")
    manifests = {}
    for key, value in records.items():
        if not key.startswith(MANIFESTS):
            continue
        rev = value["revision"]
        require(UUID.fullmatch(rev) and key == MANIFESTS + rev + ".json" and value["manifestKey"] == key, "Manifest identity mismatch")
        require(timestamp(value["persistedAt"]) <= now, "Future manifest")
        pack = value["restorePack"]
        require(re.fullmatch(r"[a-f0-9]{64}", pack["sha256"]) and pack["objectKey"] == PACKS + pack["sha256"] + ".zip", "Pack identity/namespace mismatch")
        require(objects.get(pack["objectKey"], {}).get("size") == pack["size"], "Missing or wrong-size restore pack")
        for field, prefix in (("files", ROOT + "markdown/objects/"), ("uploads", ROOT + "uploads/objects/"), ("wpContent", ROOT + "wp-content/objects/")):
            for entry in value.get(field, []):
                require(re.fullmatch(r"[a-f0-9]{64}", entry["sha256"]) and entry["objectKey"] == prefix + entry["sha256"], "Content namespace mismatch")
                require(objects.get(entry["objectKey"], {}).get("size") == entry["size"], "Missing or wrong-size content object")
        manifests[rev] = value
    require({m["manifestKey"] for m in manifests.values()} == {k for k in objects if k.startswith(MANIFESTS)}, "Manifest catalog incomplete")
    keep = {}
    def protect(revision, reason):
        require(revision in manifests, "Protected revision is missing")
        keep.setdefault(revision, set()).add(reason)
    current = records[ROOT + "markdown/current.json"]
    protect(current["revision"], "current")
    require(all(current[k] == manifests[current["revision"]][k] for k in ("revision", "manifestKey", "persistedAt")), "Current pointer mismatch")
    for revision in pins:
        protect(revision, "verified-local-backup")
    require(isinstance(registry, dict) and registry.get("schema") == "playtt/backup-pins/v1", "A verified durable backup pin registry is required")
    registered = registry.get("pins")
    require(isinstance(registered, list) and len(registered) <= 128 and type(registry.get("generation")) is int
            and registry["generation"] == len(registered), "Invalid backup pin registry generation")
    registered_revisions = set()
    for pin in registered:
        rev = pin["revision"]
        require(rev not in registered_revisions, "Duplicate registered backup revision")
        protect(rev, "durable-backup-pin")
        manifest = manifests[rev]
        require(all(pin.get(k) == manifest[k] for k in ("revision", "manifestKey", "persistedAt")), "Registered backup pointer mismatch")
        require(pin.get("packKey") == manifest["restorePack"]["objectKey"] and pin.get("packSha256") == manifest["restorePack"]["sha256"]
                and pin.get("packBytes") == manifest["restorePack"]["size"] and re.fullmatch(r"[a-f0-9]{64}", pin.get("manifestSha256", "")), "Registered backup pack mismatch")
        require(timestamp(pin["registeredAt"]) <= now, "Future backup pin registration")
        registered_revisions.add(rev)
    require(set(pins) <= registered_revisions, "Local verified backup is absent from durable protection")
    for key, value in records.items():
        if key.startswith(MANIFESTS) or key == ROOT + "markdown/current.json":
            continue
        if key.startswith(ROOT + "publications/jobs/"):
            protect(value["canonical"]["revision"], "publication-job")
        elif key.startswith(ROOT + "publications/revisions/") or key == ROOT + "publications/current.json":
            protect(value["canonicalRevision"], "publication")
        else:
            raise ValueError("Unrecognized metadata root")
    for key in objects:
        if key.startswith(ROOT + "pages/"):
            protect(key.split("/")[3], "cached-page")
    ordered = sorted(manifests.values(), key=lambda m: (timestamp(m["persistedAt"]), m["revision"]), reverse=True)
    days = set()
    for index, manifest in enumerate(ordered):
        when = timestamp(manifest["persistedAt"])
        if now - when <= dt.timedelta(hours=24):
            protect(manifest["revision"], "last-24-hours")
        if index < 20:
            protect(manifest["revision"], "latest-20")
        if (now.date() - when.date()).days < 7 and when.date() not in days:
            days.add(when.date())
            protect(manifest["revision"], "daily-7-UTC")
    retained_packs = {manifests[r]["restorePack"]["objectKey"] for r in keep}
    retired = set(manifests) - set(keep)
    candidate_keys = {manifests[r]["manifestKey"] for r in retired}
    candidate_keys.update(manifests[r]["restorePack"]["objectKey"] for r in retired if manifests[r]["restorePack"]["objectKey"] not in retained_packs)
    referenced_packs = {m["restorePack"]["objectKey"] for m in manifests.values()}
    unclassified_packs = [k for k in objects if k.startswith(PACKS) and k not in referenced_packs]
    require(not unclassified_packs, "Unreferenced pack needs separate investigation; no retirement proposal")
    by_day = {}
    for manifest in ordered:
        day = timestamp(manifest["persistedAt"]).date().isoformat()
        bucket = by_day.setdefault(day, {"revisions": 0, "uniquePackKeys": set()})
        bucket["revisions"] += 1
        bucket["uniquePackKeys"].add(manifest["restorePack"]["objectKey"])
    for entry in by_day.values():
        keys = entry.pop("uniquePackKeys")
        entry["packBytes"] = sum(objects[k]["size"] for k in keys)
    summary = {"schema": "playtt/retention-proposal/v1", "at": now.isoformat(), "mode": "offline-proposal-only", "safeToApply": False,
               "bucket": BUCKET, "inventoryAt": inventory["at"], "objects": len(objects), "bytes": sum(o["size"] for o in objects.values()),
               "revisions": len(manifests), "packBytes": sum(objects[k]["size"] for k in referenced_packs),
               "retainedRevisions": len(keep), "verifiedBackupPins": len(set(pins)), "proposedRetiredRevisions": len(retired),
               "durableBackupPins": len(registered_revisions), "registryGeneration": registry["generation"],
               "proposedObjects": len(candidate_keys), "proposedBytes": sum(objects[k]["size"] for k in candidate_keys),
               "currentRevision": current["revision"], "currentPackBytes": manifests[current["revision"]]["restorePack"]["size"], "byUtcDay": by_day,
               "policy": {"allRecentHours": 24, "latestCount": 20, "dailyDaysUTC": 7},
               "requiredBeforeAnyDeletion": ["Review retention policy and exact retirement list", "Confirm complete backup pin registry",
                   "Stop new mutation/publication work and drain in-flight operations under a renewable fence",
                   "Re-list metadata and re-check all coordinator, operation, publication and backup roots",
                   "Verify retained pack contents and perform an independent restore",
                   "Reverify fail-closed write admission together with the cleanup/reconciliation protocol; deletion alone is not a cost cap"],
               "limitations": ["This offline planner performs no cloud mutation/deletion or runtime change", "No content/ZIP reads from R2 by this planner; object sizes are metadata checks, not content integrity",
                   "Inventory is not atomic and no in-flight operation graph was captured", "Proposed storage savings are not billing savings or a free-tier guarantee"]}
    return summary, {"retained": {r: sorted(reasons) for r, reasons in keep.items()}, "proposedKeys": sorted(candidate_keys)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", type=pathlib.Path, required=True)
    parser.add_argument("--backup-root", type=pathlib.Path, required=True)
    parser.add_argument("--summary", type=pathlib.Path, required=True)
    parser.add_argument("--private-plan", type=pathlib.Path, required=True)
    parser.add_argument("--registry", type=pathlib.Path, required=True, help="Authenticated current /__playtt-backup-pins response; private, do not commit")
    args = parser.parse_args()
    inventory = json.loads(args.inventory.read_text(encoding="utf-8"))
    pins = set()
    verified_archives = 0
    for report_path in args.backup_root.glob("*/verification.json"):
        report = json.loads(report_path.read_text(encoding="utf-8"))
        if report.get("bucket") != BUCKET or report.get("result") != "pass":
            continue
        manifest = json.loads((report_path.parent / "manifest.json").read_text(encoding="utf-8"))
        with (report_path.parent / "restore.zip").open("rb") as archive:
            archive_sha = hashlib.file_digest(archive, "sha256").hexdigest()
        require(archive_sha == report["archiveSha256"] == manifest["restorePack"]["sha256"], "Local backup archive hash mismatch")
        require(manifest["revision"] == report["revision"], "Local backup report mismatch")
        require(inventory["records"].get(manifest["manifestKey"]) == manifest, "Local and remote manifest differ")
        pins.add(manifest["revision"])
        verified_archives += 1
    require(bool(pins), "No verified local backup pins found")
    registry = json.loads(args.registry.read_text(encoding="utf-8"))
    summary, private = plan(inventory, pins, timestamp(inventory["at"]), registry)
    summary["verifiedLocalArchives"] = verified_archives
    summary["privateInventorySha256"] = hashlib.sha256(args.inventory.read_bytes()).hexdigest()
    summary["privateRegistrySha256"] = hashlib.sha256(args.registry.read_bytes()).hexdigest()
    private_bytes = (json.dumps(private, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    summary["privatePlanSha256"] = hashlib.sha256(private_bytes).hexdigest()
    args.private_plan.write_bytes(private_bytes)
    args.summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
