import json
import os
import subprocess
import sys

def run_cmd(cmd, cwd=None):
    """Run a command and print its output; raise on failure."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        sys.exit(result.returncode)
    return result.stdout

def main():
    # Assume we are in the @freelanceflow/ui package root
    pkg_root = os.getcwd()
    pkg_json_path = os.path.join(pkg_root, 'package.json')
    if not os.path.isfile(pkg_json_path):
        print(f"package.json not found in {pkg_root}")
        sys.exit(1)

    # Load existing package.json
    with open(pkg_json_path, 'r') as f:
        pkg = json.load(f)

    # Update entrypoint fields
    pkg['main'] = 'dist/index.js'
    pkg['types'] = 'dist/index.d.ts'
    # Optional: add exports for better ESM/CJS support
    if 'exports' not in pkg:
        pkg['exports'] = {
            ".": {
                "import": "./dist/index.js",
                "require": "./dist/index.js"
            }
        }

    # Write back updated package.json
    with open(pkg_json_path, 'w') as f:
        json.dump(pkg, f, indent=2)
    print("Updated package.json")

    # Ensure TypeScript compiler is available and build
    run_cmd(['tsc', '--version'])
    run_cmd(['tsc'])  # reads tsconfig.json from cwd

    # Verify that the expected output files exist
    dist_index_js = os.path.join(pkg_root, 'dist', 'index.js')
    dist_index_dts = os.path.join(pkg_root, 'dist', 'index.d.ts')
    if not os.path.isfile(dist_index_js):
        print(f"Expected {dist_index_js} not found after tsc")
        sys.exit(1)
    if not os.path.isfile(dist_index_dts):
        print(f"Expected {dist_index_dts} not found after tsc")
        sys.exit(1)
    print("Build successful: dist/index.js and dist/index.d.ts created")

    # Simple test: try to import the built module via Node.js ESM dynamic import
    test_cmd = ['node', '-e', f"import('{dist_index_js}').then(m => console.log('Import succeeded', Object.keys(m))).catch(e => {{ console.error('Import failed:', e); process.exit(1); }});"]
    output = run_cmd(test_cmd)
    print("Test import output:", output.strip())

if __name__ == '__main__':
    main()