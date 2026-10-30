import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeFilename, isValidFilename } from "../utils/sanitizeFilename.js";
import { uploadFile } from "../controllers/uploadController.js";

test("sanitizeFilename - standard filenames", () => {
  assert.equal(sanitizeFilename("document.pdf"), "document.pdf");
  assert.equal(sanitizeFilename("avatar.png"), "avatar.png");
  assert.equal(sanitizeFilename("report_2026-10-23.xlsx"), "report_2026-10-23.xlsx");
  assert.equal(sanitizeFilename("my photo presentation.pptx"), "my photo presentation.pptx");
});

test("sanitizeFilename - path traversal and path separators", () => {
  // POSIX absolute and relative paths
  assert.equal(sanitizeFilename("/etc/passwd"), "passwd");
  assert.equal(sanitizeFilename("../../secret.txt"), "secret.txt");
  assert.equal(sanitizeFilename("../../../var/log/syslog"), "syslog");
  assert.equal(sanitizeFilename("folder/nested/sub/file.json"), "file.json");
  assert.equal(sanitizeFilename("///deep///nested///sample.txt"), "sample.txt");

  // Windows paths and drive letters
  assert.equal(sanitizeFilename("C:\\Users\\admin\\secret.txt"), "secret.txt");
  assert.equal(sanitizeFilename("D:\\Windows\\System32\\cmd.exe"), "cmd.exe");
  assert.equal(sanitizeFilename("..\\..\\passwords.env"), "passwords.env");
  assert.equal(sanitizeFilename("C:temp\\test.doc"), "test.doc");

  // Mixed separators
  assert.equal(sanitizeFilename("dir1/dir2\\dir3/file.tar.gz"), "file.tar.gz");

  // Standalone dot traversal tokens
  assert.equal(sanitizeFilename("."), "file");
  assert.equal(sanitizeFilename(".."), "file");
  assert.equal(sanitizeFilename("..."), "file");
  assert.equal(sanitizeFilename("../"), "file");
  assert.equal(sanitizeFilename("..\\"), "file");
});

test("sanitizeFilename - control characters, null bytes, and RTLO spoofing", () => {
  // Null byte injection
  assert.equal(sanitizeFilename("evil\0file.txt"), "evilfile.txt");

  // Newlines and carriage returns
  assert.equal(sanitizeFilename("multi\nline\r\nname.txt"), "multilinename.txt");

  // ASCII control characters (0x01 - 0x1F) and terminal escapes
  assert.equal(sanitizeFilename("test\x07bell.txt"), "testbell.txt");
  assert.equal(sanitizeFilename("ansi\x1b[31mcolor.png"), "ansi[31mcolor.png");
  assert.equal(sanitizeFilename("control\x1f\x7f\x80test.pdf"), "controltest.pdf");

  // Unicode Right-to-Left Override (RTLO) and directional marks spoofing
  assert.equal(sanitizeFilename("test\u202Efdp.exe"), "testfdp.exe");
  assert.equal(sanitizeFilename("report\u200E\u200F\u202A\u202B\u202C\u202D\u202E.doc"), "report.doc");
});

test("sanitizeFilename - Windows reserved device names", () => {
  // DOS / Windows reserved names should be prepended with underscore to prevent OS collision
  assert.equal(sanitizeFilename("CON.png"), "_CON.png");
  assert.equal(sanitizeFilename("con.txt"), "_con.txt");
  assert.equal(sanitizeFilename("PRN.pdf"), "_PRN.pdf");
  assert.equal(sanitizeFilename("AUX"), "_AUX");
  assert.equal(sanitizeFilename("NUL"), "_NUL");
  assert.equal(sanitizeFilename("nul.tar.gz"), "_nul.tar.gz");
  assert.equal(sanitizeFilename("COM1.jpg"), "_COM1.jpg");
  assert.equal(sanitizeFilename("com9.bin"), "_com9.bin");
  assert.equal(sanitizeFilename("LPT1.doc"), "_LPT1.doc");
  assert.equal(sanitizeFilename("lpt8"), "_lpt8");
});

test("sanitizeFilename - whitespace and trailing characters", () => {
  // Surrounding whitespace
  assert.equal(sanitizeFilename("   document.pdf   "), "document.pdf");
  assert.equal(sanitizeFilename("\t  invoice.pdf \t "), "invoice.pdf");

  // Trailing dots and spaces (problematic on Windows filesystems)
  assert.equal(sanitizeFilename("archive.zip..."), "archive.zip");
  assert.equal(sanitizeFilename("notes.txt.  "), "notes.txt");
});

test("sanitizeFilename - unsafe filesystem characters", () => {
  assert.equal(sanitizeFilename('file<bad>"name|with?star*.txt'), "filebadnamewithstar.txt");
});

test("sanitizeFilename - length capping and extension preservation", () => {
  // Long filename with extension
  const longBase = "a".repeat(150);
  const input = `${longBase}.png`;
  const sanitized = sanitizeFilename(input, { maxLength: 100 });
  assert.equal(sanitized.length, 100);
  assert.ok(sanitized.endsWith(".png"));
  assert.equal(sanitized, "a".repeat(96) + ".png");

  // Long filename without extension
  const longNoExt = "b".repeat(150);
  const sanitizedNoExt = sanitizeFilename(longNoExt, { maxLength: 100 });
  assert.equal(sanitizedNoExt.length, 100);
  assert.equal(sanitizedNoExt, "b".repeat(100));

  // Custom maxLength
  const customLen = sanitizeFilename("super_long_name_sample.jpeg", { maxLength: 15 });
  assert.equal(customLen.length, 15);
  assert.ok(customLen.endsWith(".jpeg"));

  // preserveExtension: false
  const noPreserve = sanitizeFilename("my_cool_image.jpeg", { maxLength: 10, preserveExtension: false });
  assert.equal(noPreserve.length, 10);
  assert.equal(noPreserve, "my_cool_im");
});

test("sanitizeFilename - empty, null, undefined, and fallback options", () => {
  assert.equal(sanitizeFilename(null), "file");
  assert.equal(sanitizeFilename(undefined), "file");
  assert.equal(sanitizeFilename(""), "file");
  assert.equal(sanitizeFilename("   "), "file");
  assert.equal(sanitizeFilename("\0\r\n"), "file");

  // Custom fallback
  assert.equal(sanitizeFilename("", { fallback: "unnamed_upload" }), "unnamed_upload");
  assert.equal(sanitizeFilename(null, { fallback: "default.bin" }), "default.bin");
  assert.equal(sanitizeFilename("../../../", { fallback: "safe_file" }), "safe_file");
});

test("isValidFilename - validation utility", () => {
  assert.equal(isValidFilename("valid_file.png"), true);
  assert.equal(isValidFilename("data-2026.csv"), true);

  // Invalid cases
  assert.equal(isValidFilename("../secret.txt"), false);
  assert.equal(isValidFilename("C:\\secret.txt"), false);
  assert.equal(isValidFilename("bad\0file.txt"), false);
  assert.equal(isValidFilename("line\nfile.txt"), false);
  assert.equal(isValidFilename("file<name>.txt"), false);
  assert.equal(isValidFilename("a".repeat(101), 100), false);
  assert.equal(isValidFilename(""), false);
  assert.equal(isValidFilename(null), false);
  assert.equal(isValidFilename(undefined), false);

  // Windows device names and RTLO
  assert.equal(isValidFilename("CON.png"), false);
  assert.equal(isValidFilename("nul"), false);
  assert.equal(isValidFilename("aux.txt"), false);
  assert.equal(isValidFilename("COM1.pdf"), false);
  assert.equal(isValidFilename("test\u202Efdp.exe"), false);
  assert.equal(isValidFilename("file.txt."), false);
  assert.equal(isValidFilename("file.txt "), false);
});

test("uploadController - integration with sanitized filenames", async () => {
  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.status = function(code) {
      res.statusCode = code;
      return res;
    };
    res.json = function(data) {
      res.body = data;
      return res;
    };
    return res;
  };

  // Case 1: Traversal attack filename
  {
    const req = { file: { originalname: "../../etc/passwd" } };
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: "passwd",
        status: "uploaded"
      }
    });
  }

  // Case 2: Control characters and null byte
  {
    const req = { file: { originalname: "payroll\0_2026\r\n.pdf" } };
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: "payroll_2026.pdf",
        status: "uploaded"
      }
    });
  }

  // Case 3: Windows path
  {
    const req = { file: { originalname: "C:\\Windows\\System32\\config.sys" } };
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: "config.sys",
        status: "uploaded"
      }
    });
  }

  // Case 4: No file uploaded
  {
    const req = {};
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: null,
        status: "no-file"
      }
    });
  }

  // Case 5: Empty/stripped filename defaults to 'file'
  {
    const req = { file: { originalname: "../" } };
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: "file",
        status: "uploaded"
      }
    });
  }

  // Case 6: Windows reserved device name in upload
  {
    const req = { file: { originalname: "CON.pdf" } };
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: "_CON.pdf",
        status: "uploaded"
      }
    });
  }

  // Case 7: RTLO character spoofing in upload
  {
    const req = { file: { originalname: "document\u202Egpj.pdf" } };
    const res = createMockRes();
    await uploadFile(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        filename: "documentgpj.pdf",
        status: "uploaded"
      }
    });
  }
});
