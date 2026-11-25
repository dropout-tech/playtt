"""Offline retention proposal only. No network, cloud deletion or apply mode.

Protect current/publication/job/cache/coordinator roots, durable backup pins,
all revisions from the last 24 hours, the latest 20, and 7 UTC daily points.
Retained overlays also protect their exact full base. Only retired manifests and unshared full packs can be proposed. Content
objects, media, themes, runtime archives and publication artifacts are excluded.
"""
import argparse
import base64
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


def plan(inventory, pins, now, registry=None, coordinator_roots=None):
    require(inventory.get("schema") == "playtt/private-capacity-inventory/v1", "Unknown inventory schema")
    require(inventory.get("bucket") in (BUCKET, "playtt-wordpress-pin-restore-audit") and inventory.get("completeListing") is True, "Incomplete or wrong-bucket inventory")
    objects = {}
    for obj in inventory["objects"]:
        key = obj["key"]
        require(isinstance(key, str) and key not in objects and ".." not in key.split("/") and "\\" not in key, "Invalid/duplicate object key")
        require(type(obj["size"]) is int and obj["size"] >= 0, "Invalid object size")
        objects[key] = obj
    records = inventory["records"]
    root_prefixes = (MANIFESTS, ROOT + "publications/revisions/", ROOT + "publications/jobs/")
    unsupported = [key for key in objects if key.startswith(ROOT + "import-artifacts/") or
                   (key.startswith(ROOT + "publications/") and not key.startswith(root_prefixes[1:]) and key != ROOT + "publications/current.json")]
    require(not unsupported, "Publication progress/claim/receipt and import roots need a dedicated lifecycle audit")
    required_records = {k for k in objects if k.startswith(root_prefixes) or k in (ROOT + "markdown/current.json", ROOT + "publications/current.json")}
    require(set(records) == required_records, "Metadata root catalog incomplete or unrecognized")
    manifests = {}
    for key, value in records.items():
        if not key.startswith(MANIFESTS):
            continue
        rev = value["revision"]
        require(UUID.fullmatch(rev) and key == MANIFESTS + rev + ".json" and value["manifestKey"] == key, "Manifest identity mismatch")
        require(timestamp(value["persistedAt"]) <= now, "Future manifest")
        for field, prefix in (("files", ROOT + "markdown/objects/"), ("uploads", ROOT + "uploads/objects/"), ("wpContent", ROOT + "wp-content/objects/")):
            for entry in value.get(field, []):
                require(re.fullmatch(r"[a-f0-9]{64}", entry["sha256"]) and entry["objectKey"] == prefix + entry["sha256"], "Content namespace mismatch")
                require(objects.get(entry["objectKey"], {}).get("size") == entry["size"], "Missing or wrong-size content object")
        manifests[rev] = value
    require({m["manifestKey"] for m in manifests.values()} == {k for k in objects if k.startswith(MANIFESTS)}, "Manifest catalog incomplete")
    resolved_packs, overlay_bases = {}, {}
    def raw_manifest(manifest):
        require(inventory.get("metadataProfile") == "references-overlay-v1", "Overlay proposal requires exact raw manifest evidence")
        encoded = inventory.get("rawManifestBytes", {}).get(manifest["manifestKey"])
        require(isinstance(encoded, str) and len(encoded) <= 349528, "Missing or oversized raw manifest")
        raw = base64.b64decode(encoded, validate=True)
        require(base64.b64encode(raw).decode("ascii") == encoded and 0 < len(raw) <= 256 * 1024, "Invalid raw manifest encoding/size")
        require(len(raw) == objects[manifest["manifestKey"]]["size"] and json.loads(raw) == manifest, "Raw manifest differs from catalog")
        return raw
    for rev, manifest in manifests.items():
        descriptor = manifest["restorePack"]
        require(descriptor.get("schema") in (None, "wp-codebox/cloudflare-canonical-restore-pack/v1", "playtt/canonical-metadata-overlay/v1"), "Unknown snapshot format")
        if descriptor.get("schema") == "playtt/canonical-metadata-overlay/v1":
            require(set(descriptor) == {"schema", "base"}, "Unknown overlay fields")
            pointer = descriptor["base"]
            require(set(pointer) == {"revision", "manifestKey", "persistedAt", "sha256", "size"}, "Invalid overlay base descriptor")
            base = manifests.get(pointer["revision"])
            require(base is not None and base["revision"] != rev, "Missing/self overlay base")
            require(all(pointer[k] == base[k] for k in ("revision", "manifestKey", "persistedAt")), "Overlay base pointer mismatch")
            pack = base["restorePack"]
            require(pack.get("schema") == "wp-codebox/cloudflare-canonical-restore-pack/v1", "Overlay requires a full base; chains forbidden")
            raw = raw_manifest(base); raw_manifest(manifest)
            require(type(pointer["size"]) is int and len(raw) == pointer["size"] and hashlib.sha256(raw).hexdigest() == pointer["sha256"], "Overlay base raw hash/size mismatch")
            require(type(pack.get("size")) is int and 0 < pack["size"] <= 8 * 1024 * 1024 and type(pack.get("decodedBytes")) is int and 0 <= pack["decodedBytes"] <= 8 * 1024 * 1024, "Overlay full base exceeds budget")
            entries = [entry for field in ("files", "uploads", "wpContent") for entry in base.get(field, [])]
            require(pack.get("fileCount") == len(entries) and pack["decodedBytes"] == sum(entry["size"] for entry in entries), "Overlay full base declared inventory mismatch")
            before = {entry["path"]: entry for entry in base["files"]}
            after = {entry["path"]: entry for entry in manifest["files"]}
            require(len(before) == len(base["files"]) and len(after) == len(manifest["files"]) and set(before) == set(after), "Overlay file inventory mismatch")
            marker = "_runtime/playtt-postmeta-layout.json"
            allowed = {"_tables/postmeta.json", "_runtime/playtt-auto-increment.json"}
            require(marker in before and before[marker] == after[marker] and allowed <= set(after), "Full postmeta layout required")
            changed = {name for name in before if before[name] != after[name]}
            require(changed and changed <= allowed and sum(after[name]["size"] for name in allowed) <= 256 * 1024, "Overlay exceeds metadata-only inventory")
            require(all(base.get(field, []) == manifest.get(field, []) for field in ("uploads", "wpContent", "wpContentDeleted")), "Overlay changes nonmetadata assets")
            overlay_bases[rev] = base["revision"]
        else:
            pack = descriptor
        require(re.fullmatch(r"[a-f0-9]{64}", pack["sha256"]) and pack["objectKey"] == PACKS + pack["sha256"] + ".zip", "Pack identity/namespace mismatch")
        require(objects.get(pack["objectKey"], {}).get("size") == pack["size"], "Missing or wrong-size restore pack")
        resolved_packs[rev] = pack
    keep = {}
    def protect(revision, reason):
        require(revision in manifests, "Protected revision is missing")
        keep.setdefault(revision, set()).add(reason)
    current = records[ROOT + "markdown/current.json"]
    protect(current["revision"], "current")
    require(all(current[k] == manifests[current["revision"]][k] for k in ("revision", "manifestKey", "persistedAt")), "Current pointer mismatch")
    roots = coordinator_roots
    require(isinstance(roots, dict) and roots.get("schema") == "playtt/coordinator-reference-roots/v1" and roots.get("siteId") == "default", "Complete coordinator roots are required")
    require(roots.get("completeCommitListing") is True and roots.get("safeToApply") is False and roots.get("pointer") == current, "Incomplete or divergent coordinator roots")
    receipts = roots.get("commitReceipts")
    require(type(roots.get("version")) is int and roots["version"] > 0, "Invalid coordinator version")
    require(isinstance(receipts, list) and 0 < len(receipts) <= 2048, "Invalid commit receipt listing")
    versions = set()
    def protect_pointer(pointer, reason):
        require(isinstance(pointer, dict) and pointer.get("revision") in manifests, "Referenced coordinator revision missing")
        require(all(pointer.get(k) == manifests[pointer["revision"]][k] for k in ("revision", "manifestKey", "persistedAt")), "Coordinator pointer mismatch")
        protect(pointer["revision"], reason)
    for receipt in receipts:
        version = receipt.get("version")
        require(type(version) is int and 0 < version <= roots["version"] and version not in versions, "Duplicate/invalid commit receipt")
        versions.add(version); protect_pointer(receipt.get("pointer"), "coordinator-commit-receipt")
    require(any(r["version"] == roots.get("version") and r["pointer"] == current for r in receipts), "Current commit receipt missing")
    if roots.get("lease") and roots["lease"].get("base"):
        protect_pointer(roots["lease"]["base"], "coordinator-lease-base-including-expired")
    for revision in pins:
        protect(revision, "declared-local-protection")
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
        require(pin.get("packKey") == resolved_packs[manifest["revision"]]["objectKey"] and pin.get("packSha256") == resolved_packs[manifest["revision"]]["sha256"]
                and pin.get("packBytes") == resolved_packs[manifest["revision"]]["size"] and re.fullmatch(r"[a-f0-9]{64}", pin.get("manifestSha256", "")), "Registered backup pack mismatch")
        require(timestamp(pin["registeredAt"]) <= now, "Future backup pin registration")
        if rev in overlay_bases or manifest["manifestKey"] in inventory.get("rawManifestBytes", {}):
            require(hashlib.sha256(raw_manifest(manifest)).hexdigest() == pin["manifestSha256"], "Pinned raw manifest hash mismatch")
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
    for revision in list(keep):
        if revision in overlay_bases:
            protect(overlay_bases[revision], "retained-overlay-base")
    retained_packs = {resolved_packs[r]["objectKey"] for r in keep}
    retired = set(manifests) - set(keep)
    candidate_keys = {manifests[r]["manifestKey"] for r in retired}
    candidate_keys.update(resolved_packs[r]["objectKey"] for r in retired if resolved_packs[r]["objectKey"] not in retained_packs)
    referenced_packs = {resolved_packs[r]["objectKey"] for r in manifests}
    unclassified_packs = [k for k in objects if k.startswith(PACKS) and k not in referenced_packs]
    require(not unclassified_packs, "Unreferenced pack needs separate investigation; no retirement proposal")
    by_day = {}
    for manifest in ordered:
        day = timestamp(manifest["persistedAt"]).date().isoformat()
        bucket = by_day.setdefault(day, {"revisions": 0, "uniquePackKeys": set()})
        bucket["revisions"] += 1
        bucket["uniquePackKeys"].add(resolved_packs[manifest["revision"]]["objectKey"])
    for entry in by_day.values():
        keys = entry.pop("uniquePackKeys")
        entry["packBytes"] = sum(objects[k]["size"] for k in keys)
    summary = {"schema": "playtt/retention-proposal/v1", "at": now.isoformat(), "mode": "offline-proposal-only", "safeToApply": False,
               "bucket": inventory["bucket"], "inventoryAt": inventory["at"], "objects": len(objects), "bytes": sum(o["size"] for o in objects.values()),
               "revisions": len(manifests), "packBytes": sum(objects[k]["size"] for k in referenced_packs),
               "retainedRevisions": len(keep), "declaredLocalProtectionPoints": len(set(pins)), "proposedRetiredRevisions": len(retired),
               "overlayRevisions": len(overlay_bases), "retainedOverlayBases": len({overlay_bases[r] for r in keep if r in overlay_bases}),
               "coordinatorReceiptsProtected": len(receipts), "leaseBaseIncluded": bool(roots.get("lease") and roots["lease"].get("base")),
               "localBackupIntegrityVerified": False, "durableBackupPins": len(registered_revisions), "registryGeneration": registry["generation"],
               "proposedObjects": len(candidate_keys), "proposedBytes": sum(objects[k]["size"] for k in candidate_keys),
               "currentRevision": current["revision"], "currentPackBytes": resolved_packs[current["revision"]]["size"], "byUtcDay": by_day,
               "policy": {"allRecentHours": 24, "latestCount": 20, "dailyDaysUTC": 7},
               "requiredBeforeAnyDeletion": ["Review retention policy and exact retirement list", "Confirm complete backup pin registry",
                   "Stop new mutation/publication work and drain in-flight operations under a renewable fence",
                   "Re-list metadata and re-check all coordinator, operation, publication and backup roots",
                   "Verify retained pack contents and perform an independent restore",
                   "Reverify fail-closed write admission together with the cleanup/reconciliation protocol; deletion alone is not a cost cap"],
               "limitations": ["This offline planner performs no cloud mutation/deletion or runtime change", "No ZIP/content or local backup decoding by this planner; overlay raw hashes verify metadata identity, not content semantics",
                   "Inventory is not atomic; complete coordinator roots are required, but in-flight R2 operation and external-writer graphs are not captured", "Proposed storage savings are not billing savings or a free-tier guarantee"]}
    return summary, {"retained": {r: sorted(reasons) for r, reasons in keep.items()}, "proposedKeys": sorted(candidate_keys)}


def main():
    parser = argparse.ArgumentParser(description="Offline dependency-aware proposal only; never deletes or applies")
    for name in ("inventory", "registry", "coordinator-roots", "summary", "private-plan"):
        parser.add_argument("--" + name, type=pathlib.Path, required=True)
    parser.add_argument("--local-protection", type=pathlib.Path, help="Optional JSON array of extra revision IDs; must already be durably pinned. This is not an integrity certificate.")
    args = parser.parse_args()
    load = lambda p: json.loads(p.read_text(encoding="utf-8"))
    inventory, registry, roots = load(args.inventory), load(args.registry), load(args.coordinator_roots)
    local = load(args.local_protection) if args.local_protection else []
    require(isinstance(local, list) and all(isinstance(x, str) for x in local), "Invalid local protection list")
    summary, private = plan(inventory, local, timestamp(inventory["at"]), registry, roots)
    for label, path in (("Inventory", args.inventory), ("Registry", args.registry), ("CoordinatorRoots", args.coordinator_roots)):
        summary["private" + label + "Sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    private_bytes = (json.dumps(private, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    summary["privatePlanSha256"] = hashlib.sha256(private_bytes).hexdigest()
    args.private_plan.write_bytes(private_bytes)
    args.summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))

if __name__ == "__main__":
    main()
