export type PdfButtonAction = "print" | "save" | "reset";

/** Recognises a single supported PDF button command without evaluating document code.
 * Arbitrary expressions, arguments, compound scripts and unknown commands are rejected. */
export function getPdfButtonAction(script: string): PdfButtonAction | null {
  const direct =
    /^\s*(?:this|doc)\s*\.\s*(print|save|saveAs|resetForm)\s*\(\s*\)\s*;?\s*$/.exec(
      script,
    );
  if (direct) {
    if (direct[1] === "print") return "print";
    if (direct[1] === "resetForm") return "reset";
    return "save";
  }

  const menu =
    /^\s*app\s*\.\s*execMenuItem\s*\(\s*(["'])(Print|Save)\1\s*\)\s*;?\s*$/.exec(
      script,
    );
  if (menu) return menu[2] === "Print" ? "print" : "save";
  return null;
}
