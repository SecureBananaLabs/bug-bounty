#!/usr/bin/env python3
import html
import http.server
import pathlib
import shutil
import socketserver
import subprocess
import threading

ROOT = pathlib.Path(__file__).resolve().parents[2]
REPORTS = ROOT / "benchmarks" / "results"
FRAMES = REPORTS / "demo-frames"
REPORTS.mkdir(parents=True, exist_ok=True)


def run_command(command):
    result = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=True)
    return "$ " + " ".join(command) + "\n" + result.stdout


def write_demo_html():
    coverage_output = run_command(["npm", "run", "benchmark:coverage"])
    smoke_output = run_command(["npm", "run", "benchmark:smoke"])
    md = (REPORTS / "latest.md").read_text(encoding="utf-8")
    artifact_lines = []
    for path in [
        ROOT / "benchmarks" / "scenarios.mjs",
        ROOT / "benchmarks" / "thresholds.json",
        ROOT / "benchmarks" / "results" / "latest.json",
        ROOT / "benchmarks" / "results" / "latest.md",
        ROOT / ".github" / "workflows" / "benchmark-smoke.yml",
    ]:
        rel = path.relative_to(ROOT)
        size = path.stat().st_size if path.exists() else 0
        artifact_lines.append(f"{rel} ({size} bytes)")

    html_path = REPORTS / "latest-demo.html"
    html_path.write_text(f"""
<!doctype html><html><head><meta charset='utf-8'><title>API Benchmark Demo</title>
<style>
*{{box-sizing:border-box}}
html,body{{background:#07101f}}
body{{font-family:Inter,Arial,sans-serif;color:#e8eefc;margin:0;padding:32px;width:1280px;min-height:720px;overflow:hidden}}
h1{{color:#8bd3ff;margin:0 0 8px;font-size:34px}}
h2{{color:#d8e7ff;margin:28px 0 10px;font-size:22px}}
p{{margin:0 0 18px;color:#b9c7e6;font-size:17px}}
pre{{white-space:pre-wrap;background:#101936;border:1px solid #26345f;border-radius:12px;padding:20px;font-size:14px;line-height:1.42;width:100%;margin:0;box-shadow:0 12px 30px rgba(0,0,0,.25)}}
.terminal{{background:#050914;color:#d8ffe2;border-color:#244b38}}
.files{{background:#111827;color:#f4d58d;border-color:#3d3320}}
.badge{{display:inline-block;background:#123a2a;color:#8ef0b3;border:1px solid #236c4a;border-radius:999px;padding:4px 10px;margin-left:10px;font-size:14px}}
</style></head>
<body>
<h1>SecureBanana API Benchmark Demo <span class='badge'>real local run</span></h1>
<p>This demo runs the new benchmark commands, verifies endpoint coverage, and scrolls the generated report/artifacts for issue #30.</p>
<h2>1. Endpoint coverage command</h2><pre class='terminal'>{html.escape(coverage_output)}</pre>
<h2>2. Smoke benchmark command</h2><pre class='terminal'>{html.escape(smoke_output)}</pre>
<h2>3. Generated artifacts</h2><pre class='files'>{html.escape(chr(10).join(artifact_lines))}</pre>
<h2>4. Generated benchmark report</h2><pre>{html.escape(md)}</pre>
</body></html>
""", encoding="utf-8")
    return html_path


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def capture_frames():
    if FRAMES.exists():
        shutil.rmtree(FRAMES)
    FRAMES.mkdir(parents=True)

    PORT = 8123
    server = socketserver.TCPServer(("127.0.0.1", PORT), lambda *args, **kwargs: Handler(*args, directory=str(REPORTS), **kwargs))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
            page.goto(f"http://127.0.0.1:{PORT}/latest-demo.html", wait_until="networkidle")
            page.wait_for_timeout(300)
            max_scroll = page.evaluate("Math.max(0, document.documentElement.scrollHeight - window.innerHeight)")
            # Hold the first and final frames briefly, with smooth monotonic scroll between them.
            positions = [0] * 10
            steps = 96
            positions += [round(max_scroll * i / steps) for i in range(steps + 1)]
            positions += [round(max_scroll)] * 14
            for idx, y in enumerate(positions):
                page.evaluate(f"window.scrollTo(0, {y})")
                page.screenshot(path=str(FRAMES / f"frame-{idx:04d}.png"), full_page=False, animations="disabled")
            browser.close()
    finally:
        server.shutdown()


def encode_video():
    output = REPORTS / "benchmark-demo.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-framerate", "12",
        "-i", str(FRAMES / "frame-%04d.png"),
        "-vf", "format=yuv420p",
        "-c:v", "libx264",
        "-movflags", "+faststart",
        str(output),
    ], check=True)
    print(f"Demo video: {output}")


write_demo_html()
capture_frames()
encode_video()
