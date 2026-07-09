1.  Locate the `package.json` file for the web workspace.
2.  Add an `overrides` field to the `package.json` file, specifying `postcss` with the version `8.5.10`.
    Example:
    ```json
    "overrides": {
      "postcss": "8.5.10"
    }
    ```
3.  Run `npm install` in the web workspace directory to apply the override and update `package-lock.json`.
4.  Verify the fix by running `npm audit --omit=dev` and confirming the PostCSS advisory is resolved.
5.  Optionally, run `npm ls postcss --all` to confirm `postcss@8.5.10` is now resolved.