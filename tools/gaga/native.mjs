import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { release } from "node:os";
export async function startNative() {
  assert.ok(
    !(process.platform === "darwin" && Number(release().split(".")[0]) < 21),
    "Native proof requires supported hosted Linux/macOS",
  );
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  await new Promise((r) => server.close(r));
  const config = `using Workerd = import "/workerd/workerd.capnp";\nconst config :Workerd.Config = (services = [(name = "main", worker = (modules = [(name = "worker.mjs", esModule = embed "../worker/bundle.mjs")], compatibilityDate = "2026-10-22", compatibilityFlags = ["no_nodejs_compat", "no_nodejs_compat_v2"], globalOutbound = "offline")),(name = "offline", network = (allow = []))],sockets = [(name = "http", address = "127.0.0.1:${port}", http = (), service = "main")]);\n`;
  writeFileSync(".gaga/workerd.capnp", config);
  const bin = fileURLToPath(
    import.meta.resolve(
      "@cloudflare/workerd-" +
        process.platform +
        "-" +
        (process.arch === "x64" ? "64" : "arm64") +
        "/bin/workerd",
    ),
  );
  assert.ok(
    ["7f454c46", "cffaedfe", "feedfacf", "cafebabe"].includes(
      readFileSync(bin).subarray(0, 4).toString("hex"),
    ),
    "Native executable required",
  );
  const child = spawn(bin, ["serve", ".gaga/workerd.capnp"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: Object.fromEntries(
      ["PATH", "LANG", "HOME", "TMPDIR"]
        .filter((k) => process.env[k])
        .map((k) => [k, process.env[k]]),
    ),
  });
  let output = "",
    failure;
  child.stderr.on("data", (x) => (output += x));
  child.stdout.on("data", (x) => (output += x));
  child.on("error", (e) => (failure = e.code));
  const url = "http://127.0.0.1:" + port;
  async function stop() {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await Promise.race([
        new Promise((r) => child.once("exit", r)),
        delay(1500),
      ]);
      if (child.exitCode === null) child.kill("SIGKILL");
    }
    writeFileSync(".gaga/workerd.log", output);
  }
  try {
    for (let i = 0; i < 50; i++) {
      assert.ok(
        !failure && child.exitCode === null,
        "Native startup failed: " + failure + " " + output,
      );
      try {
        const r = await fetch(url + "/api/search?q=Akal", {
          signal: AbortSignal.timeout(1000),
        });
        if (r.status === 200) return { url, stop };
      } catch {}
      await delay(200);
    }
    throw Error("Native readiness timeout");
  } catch (e) {
    await stop();
    throw e;
  }
}
