import copy
import datetime as dt
import unittest
import uuid

from plan_retention import BUCKET, ROOT, MANIFESTS, PACKS, plan as plan_with_registry

NOW = dt.datetime(2026, 11, 20, tzinfo=dt.timezone.utc)


def registry_for(inventory, revisions):
    pins = []
    for revision in revisions:
        m = inventory["records"][MANIFESTS + revision + ".json"]
        pins.append({k: m[k] for k in ("revision", "manifestKey", "persistedAt")})
        pins[-1].update(manifestSha256="a"*64, packKey=m["restorePack"]["objectKey"], packSha256=m["restorePack"]["sha256"],
                        packBytes=m["restorePack"]["size"], registeredAt=NOW.isoformat())
    return {"schema": "playtt/backup-pins/v1", "generation": len(pins), "pins": pins}


def plan(inventory, pins, now, registry=None):
    return plan_with_registry(inventory, pins, now, registry if registry is not None else registry_for(inventory, []))


def fixture():
    objects, records, revisions = [], {}, []
    for index in range(1, 31):
        rev = str(uuid.UUID(int=index))
        revisions.append(rev)
        digest = f"{index:064x}"
        key, pack = MANIFESTS + rev + ".json", PACKS + digest + ".zip"
        records[key] = {"revision": rev, "manifestKey": key,
                        "persistedAt": (NOW - dt.timedelta(days=10, hours=31-index)).isoformat(),
                        "files": [], "uploads": [], "wpContent": [],
                        "restorePack": {"objectKey": pack, "sha256": digest, "size": 1000}}
        objects.extend([{"key": key, "size": 100}, {"key": pack, "size": 1000}])
    current = records[MANIFESTS + revisions[-1] + ".json"]
    key = ROOT + "markdown/current.json"
    records[key] = {k: current[k] for k in ("revision", "manifestKey", "persistedAt")}
    objects.append({"key": key, "size": 100})
    objects.extend({"key": key, "size": 500} for key in ("runtime/core.zip", ROOT + "uploads/objects/untouched", ROOT + "wp-content/objects/untouched"))
    return {"schema": "playtt/private-capacity-inventory/v1", "bucket": BUCKET, "at": NOW.isoformat(), "completeListing": True, "objects": objects, "records": records}, revisions


class RetentionTests(unittest.TestCase):
    def test_proposal_is_never_executable_and_only_known_manifest_pack_keys(self):
        inventory, _ = fixture()
        summary, private = plan(inventory, [], NOW)
        self.assertFalse(summary["safeToApply"])
        self.assertEqual(summary["proposedRetiredRevisions"], 10)
        self.assertEqual(summary["proposedBytes"], 11000)
        self.assertTrue(all(k.startswith((MANIFESTS, PACKS)) for k in private["proposedKeys"]))

    def test_old_current_backup_publication_job_and_cache_are_protected(self):
        inv, revs = fixture()
        current = inv["records"][MANIFESTS + revs[0] + ".json"]
        inv["records"][ROOT + "markdown/current.json"] = {k: current[k] for k in ("revision", "manifestKey", "persistedAt")}
        for key, body in ((ROOT + "publications/current.json", {"canonicalRevision": revs[2]}),
                          (ROOT + "publications/jobs/job.json", {"canonical": {"revision": revs[3]}})):
            inv["objects"].append({"key": key, "size": 10})
            inv["records"][key] = body
        inv["objects"].append({"key": ROOT + "pages/" + revs[4] + "/home.json", "size": 10})
        summary, private = plan(inv, [revs[1]], NOW, registry_for(inv, [revs[1]]))
        self.assertEqual(summary["proposedRetiredRevisions"], 5)
        self.assertTrue(all(rev in private["retained"] for rev in revs[:5]))

    def test_shared_pack_is_kept_if_any_retained_manifest_needs_it(self):
        inv, revs = fixture()
        old, new = (inv["records"][MANIFESTS + rev + ".json"] for rev in (revs[0], revs[-1]))
        removed = old["restorePack"]["objectKey"]
        inv["objects"] = [o for o in inv["objects"] if o["key"] != removed]
        old["restorePack"] = copy.deepcopy(new["restorePack"])
        summary, private = plan(inv, [], NOW)
        self.assertEqual(summary["proposedObjects"], 19)
        self.assertNotIn(new["restorePack"]["objectKey"], private["proposedKeys"])

    def test_recent_and_daily_points_survive_latest_count(self):
        inv, revs = fixture()
        for index, rev in enumerate(revs[:3]):
            inv["records"][MANIFESTS + rev + ".json"]["persistedAt"] = (NOW - dt.timedelta(hours=index)).isoformat()
        inv["records"][MANIFESTS + revs[3] + ".json"]["persistedAt"] = (NOW - dt.timedelta(days=6)).isoformat()
        _, private = plan(inv, [], NOW)
        self.assertIn("last-24-hours", private["retained"][revs[1]])
        self.assertIn("daily-7-UTC", private["retained"][revs[3]])

    def test_incomplete_catalogs_wrong_bucket_and_duplicate_keys_fail_closed(self):
        for mutation in (lambda x: x.update(completeListing=False), lambda x: x.update(bucket="another-project"),
                         lambda x: x["objects"].append(copy.deepcopy(x["objects"][0])),
                         lambda x: x["records"].pop(next(iter(x["records"]))),
                         lambda x: x["records"].pop(ROOT + "markdown/current.json")):
            with self.subTest(mutation=mutation):
                inv, _ = fixture()
                mutation(inv)
                with self.assertRaises(ValueError):
                    plan(inv, [], NOW)

    def test_missing_pack_wrong_size_cross_site_and_pointer_mismatch_fail_closed(self):
        for mode in ("missing", "wrong-size", "cross-site", "pointer"):
            inv, revs = fixture()
            first = inv["records"][MANIFESTS + revs[0] + ".json"]
            if mode == "missing": inv["objects"] = [o for o in inv["objects"] if o["key"] != first["restorePack"]["objectKey"]]
            if mode == "wrong-size": first["restorePack"]["size"] = 999
            if mode == "cross-site": first["restorePack"]["objectKey"] = first["restorePack"]["objectKey"].replace("default", "other")
            if mode == "pointer": inv["records"][ROOT + "markdown/current.json"]["persistedAt"] = NOW.isoformat()
            with self.subTest(mode=mode), self.assertRaises(ValueError):
                plan(inv, [], NOW)

    def test_missing_backup_pin_or_unclassified_pack_fails_closed(self):
        inv, _ = fixture()
        with self.assertRaises(ValueError): plan(inv, [str(uuid.UUID(int=100))], NOW)
        inv["objects"].append({"key": PACKS + "a" * 64 + ".zip", "size": 1})
        with self.assertRaises(ValueError): plan(inv, [], NOW)

    def test_omitted_job_record_cannot_hide_a_root(self):
        inv, _ = fixture()
        inv["objects"].append({"key": ROOT + "publications/jobs/hidden.json", "size": 10})
        with self.assertRaises(ValueError): plan(inv, [], NOW)

    def test_registered_backup_remains_protected_without_a_local_copy(self):
        inv, revs = fixture()
        summary, private = plan(inv, [], NOW, registry_for(inv, [revs[0]]))
        self.assertEqual(summary["durableBackupPins"], 1)
        self.assertIn("durable-backup-pin", private["retained"][revs[0]])
        self.assertEqual(summary["proposedRetiredRevisions"], 9)

    def test_absent_or_mismatched_registry_cannot_produce_a_plan(self):
        inv, revs = fixture()
        with self.assertRaises(ValueError): plan_with_registry(inv, [], NOW)
        with self.assertRaises(ValueError): plan(inv, [revs[0]], NOW)
        for kind in ["generation", "duplicate", "pack", "pointer", "future"]:
            registry = registry_for(inv, [revs[0]])
            if kind == "generation": registry["generation"] = 2
            if kind == "duplicate": registry["pins"].append(copy.deepcopy(registry["pins"][0])); registry["generation"] = 2
            if kind == "pack": registry["pins"][0]["packBytes"] += 1
            if kind == "pointer": registry["pins"][0]["persistedAt"] = NOW.isoformat()
            if kind == "future": registry["pins"][0]["registeredAt"] = (NOW+dt.timedelta(days=1)).isoformat()
            with self.subTest(kind=kind), self.assertRaises(ValueError): plan(inv, [], NOW, registry)


if __name__ == "__main__":
    unittest.main()
