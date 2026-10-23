# English-first usability fork

This fork prioritises a dependable PDF workflow on macOS: open a document, navigate it, edit it, undo changes, and save a valid result. Usability comes before new tools. Security review follows each meaningful change.

English is the primary interface language. Afrikaans and Zulu are secondary OCR priorities; this fork does not claim translated Afrikaans or Zulu interfaces. Other upstream translations are retained to avoid unnecessary divergence.

## Initial changes

- OCR language choices put English first, Afrikaans second and Zulu third when those models are installed. Existing selections are preserved.
- Zulu has an explicit OCR display name and locale mapping.
- Failed OCR language requests show an explanation and Retry. Stale requests cannot replace newer results.
- An empty OCR model list explains how to enable text recognition instead of presenting a blank selector.
- PDF form buttons recognise a small set of Print, Save and Reset commands without evaluating embedded JavaScript. Unsupported scripts show a warning. General Acrobat scripting is intentionally unsupported until a proper isolated implementation exists.

## Optional local configuration

`settings.yml` is a small profile to merge into your existing server configuration, or copy into a fresh installation's configuration directory as `settings.yml`. It sets English as the default, limits the interface selector to US/UK English, starts in reading mode, hides unavailable tools/conversions by default, and disables server analytics. It does not configure authentication, install OCR models, or disable every possible desktop telemetry path.

Keep your existing security, storage and deployment settings when applying the profile. The profile is opt-in; it is not automatically installed by cloning this repository.

OCR models must be installed separately using the upstream OCR setup process. Prioritising a language in the picker does not install it. Keep English available; add Afrikaans and Zulu only when needed.

## Next usability work

1. Reproduce and fix editing/undo defects with real English documents and verify the saved PDF in a second reader.
2. Make Save, Save As, unsaved-change indicators and recovery consistent.
3. Benchmark large scanned and vector PDFs; improve navigation only against repeatable measurements.
4. Verify Mac keyboard shortcuts, Finder opening, mounted drives and printing on a built Mac app.
5. Audit document input, filesystem and network boundaries, then update dependencies with focused compatibility tests.

Issue reports are leads, not confirmed defects in this revision. No broad dependency upgrade or unrelated language project is included in this first change.

## Validation and limitations

See `REVIEW.md` for the initial security scan and verification results. No Mac installer has been built or released from this fork. The codebase retains upstream's mixed licensing: the core is MIT, while several directories have separate terms. This change touches the MIT core only and preserves all license notices; it does not grant permission to distribute restricted desktop components.
