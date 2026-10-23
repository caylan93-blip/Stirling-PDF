import type { ReactNode, ButtonHTMLAttributes } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LanguagePicker from "@app/components/tools/ocr/LanguagePicker";
import apiClient from "@app/services/apiClient";
import {
  getOcrDisplayName,
  mapBrowserLanguageToOcr,
} from "@app/utils/languageMapping";

vi.mock("@app/services/apiClient", () => ({ default: { get: vi.fn() } }));
vi.mock("react-i18next", () => {
  const t = (key: string, fallback?: string) => fallback ?? key;
  const i18n = { language: "en-US" };
  return { useTranslation: () => ({ t, i18n }) };
});
vi.mock("@mantine/core", () => ({
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Loader: () => <span>Loading</span>,
}));
vi.mock("@app/ui/Button", () => ({
  Button: ({
    variant: _variant,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props} />
  ),
}));
vi.mock("@app/components/shared/DropdownListWithFooter", () => ({
  default: ({ items }: { items: { value: string; name: string }[] }) => (
    <ul>
      {items.map((item) => (
        <li key={item.value}>{item.value}</li>
      ))}
    </ul>
  ),
}));

const get = vi.mocked(apiClient.get);

describe("OCR language selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts English first, followed by Afrikaans and Zulu, without inventing installed languages", async () => {
    get.mockResolvedValue({
      data: { languages: ["deu", "zul", "afr", "eng", "eng"] },
    });
    render(<LanguagePicker value={[]} onChange={vi.fn()} />);
    await screen.findByRole("list");
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["eng", "afr", "zul", "deu"]);
    expect(mapBrowserLanguageToOcr("zu-ZA")).toBe("zul");
    expect(getOcrDisplayName("zul")).toBe("Zulu");
  });

  it("offers a retry after a failed language request", async () => {
    get.mockRejectedValueOnce(new Error("offline"));
    get.mockResolvedValueOnce({ data: { languages: ["eng"] } });
    const onChange = vi.fn();
    render(<LanguagePicker value={[]} onChange={onChange} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load OCR languages",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("list");
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["eng"]));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains missing language data without selecting an unavailable language", async () => {
    get.mockResolvedValue({ data: { languages: [] } });
    const onChange = vi.fn();
    render(<LanguagePicker value={[]} onChange={onChange} />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "No OCR languages are installed",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not replace an existing language selection", async () => {
    get.mockResolvedValue({ data: { languages: ["eng", "afr"] } });
    const onChange = vi.fn();
    render(<LanguagePicker value={["afr"]} onChange={onChange} />);
    await screen.findByRole("list");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a stale request after the language source changes", async () => {
    let resolveOld!: (value: { data: { languages: string[] } }) => void;
    get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    get.mockResolvedValueOnce({ data: { languages: ["eng"] } });
    const onChange = vi.fn();
    const { rerender } = render(
      <LanguagePicker
        value={["eng"]}
        onChange={onChange}
        languagesEndpoint="/old"
      />,
    );
    rerender(
      <LanguagePicker
        value={["eng"]}
        onChange={onChange}
        languagesEndpoint="/new"
      />,
    );
    await screen.findByRole("list");
    resolveOld({ data: { languages: ["afr"] } });
    await waitFor(() =>
      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent),
      ).toEqual(["eng"]),
    );
  });
});
