import { describe, expect, it } from "vitest";
import { getPdfButtonAction } from "@app/tools/formFill/pdfButtonAction";

describe("PDF button actions", () => {
  it.each([
    ["this.print();", "print"],
    [" doc . saveAs ( ) ; ", "save"],
    ["this.resetForm()", "reset"],
    ['app.execMenuItem("Print")', "print"],
    ["app.execMenuItem('Save');", "save"],
  ])("recognises %s without evaluating it", (script, expected) => {
    expect(getPdfButtonAction(script)).toBe(expected);
  });

  it.each([
    "",
    "while (true) {}",
    "self.auditProbe = true",
    'this.print(); fetch("https://example.com")',
    "this.print(globalThis)",
    'app.execMenuItem("Print" + "Save")',
    'app["execMenuItem"]("Print")',
    "this.resetForm(['name'])",
    "this.print(); this.save();",
    "app.execMenuItem(\"Print')",
    "this.print()\n;globalThis.compromised = true",
  ])("rejects unsupported document code: %s", (script) => {
    expect(getPdfButtonAction(script)).toBeNull();
  });
});
