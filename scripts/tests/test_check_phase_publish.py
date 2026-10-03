"""Exercise the publish lock through the real gate and a real Git index.

Unrelated npm/claims checks are stubbed: the full phase gate is run separately.
"""

import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
FIXTURES = Path(__file__).with_name("fixtures")


class PublishOverrideTests(unittest.TestCase):
    def run_gate(self, fixture):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for path in ("scripts", "bin", "content/posts", "docs/superpowers/specs"):
                (root / path).mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / "scripts/check-phase.sh", root / "scripts/check-phase.sh")
            (root / "scripts/check-public-claims.py").write_text("raise SystemExit(0)\n")
            npm = root / "bin/npm"
            npm.write_text("#!/bin/sh\nexit 0\n")
            npm.chmod(0o755)
            env = {**os.environ, "PATH": f"{root / 'bin'}:{os.environ['PATH']}"}
            # Isolate the fixture index even when invoked by a Git hook.
            for key in ("GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"):
                env.pop(key, None)
            def git(*args):
                subprocess.run(["git", *args], cwd=root, env=env, check=True,
                               stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            git("init", "-q")
            git("-c", "user.name=Gate Test", "-c", "user.email=gate@example.invalid",
                "-c", "core.hooksPath=/dev/null", "commit", "--allow-empty", "-qm", "baseline")
            (root / "content/posts/example.mdx").write_text("fixture\n")
            shutil.copyfile(FIXTURES / fixture, root / "docs/superpowers/specs/overrides.md")
            git("add", "content/posts/example.mdx", "docs/superpowers/specs/overrides.md")
            return subprocess.run(["bash", "scripts/check-phase.sh", "--hard"],
                                  cwd=root, env=env, capture_output=True, text=True)

    def test_reason_is_not_authorization(self):
        result = self.run_gate("override-in-reason.md")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("published content staged with NO matching override", result.stdout)

    def test_approved_by_is_not_authorization(self):
        result = self.run_gate("override-in-approved-by.md")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("published content staged with NO matching override", result.stdout)

    def test_real_indented_field_is_authorization(self):
        result = self.run_gate("override-field.md")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("All gates green", result.stdout)


if __name__ == "__main__":
    unittest.main()
