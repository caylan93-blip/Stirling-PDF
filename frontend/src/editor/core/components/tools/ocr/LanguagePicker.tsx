import React, { useState, useEffect } from "react";
import { Text, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  getAutoOcrLanguage,
  getBrowserLanguagesForOcr,
  getOcrDisplayName,
} from "@app/utils/languageMapping";
import { Button } from "@app/ui/Button";
import apiClient from "@app/services/apiClient";
import DropdownListWithFooter, {
  DropdownItem,
} from "@app/components/shared/DropdownListWithFooter";

export interface LanguageOption {
  value: string;
  label: string;
}

export interface LanguagePickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  languagesEndpoint?: string;
  autoFillFromBrowserLanguage?: boolean;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  languagesEndpoint = "/api/v1/ui-data/ocr-pdf",
  autoFillFromBrowserLanguage = true,
}) => {
  const { t, i18n } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("dropdownList.selectLanguages");
  const [availableLanguages, setAvailableLanguages] = useState<DropdownItem[]>(
    [],
  );
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchLanguages = async () => {
      setIsLoadingLanguages(true);
      setLoadFailed(false);
      try {
        const { data } = await apiClient.get<{ languages: string[] }>(
          languagesEndpoint,
        );

        if (!active) return;

        const displayNames =
          typeof Intl.DisplayNames !== "undefined"
            ? new Intl.DisplayNames([i18n.language], { type: "language" })
            : null;

        const languageOptions = [...new Set(data.languages)]
          .map((lang) => {
            const displayName = getOcrDisplayName(lang);
            const browserLanguageCodes = getBrowserLanguagesForOcr(lang);

            const langKey = `lang.${lang}`;
            const translatedFromKey = t(langKey);
            const hasKeyTranslation = translatedFromKey !== langKey;

            const intlTranslatedName = displayNames
              ? browserLanguageCodes
                  .map((code) => displayNames.of(code))
                  .find((name): name is string => Boolean(name))
              : null;

            const translatedName =
              (hasKeyTranslation ? translatedFromKey : null) ||
              intlTranslatedName ||
              t(`ocr.languages.${lang}`, displayName);

            return {
              value: lang,
              name: translatedName,
              label: translatedName,
            };
          })
          .sort((a, b) => {
            const priority = ["eng", "afr", "zul"];
            const rank = (code: string) => {
              const index = priority.indexOf(code);
              return index < 0 ? priority.length : index;
            };
            return (
              rank(a.value) - rank(b.value) ||
              a.name.localeCompare(b.name, i18n.language)
            );
          });

        setAvailableLanguages(languageOptions);
      } catch {
        if (active) {
          setAvailableLanguages([]);
          setLoadFailed(true);
        }
      } finally {
        if (active) setIsLoadingLanguages(false);
      }
    };

    void fetchLanguages();
    return () => {
      active = false;
    };
  }, [languagesEndpoint, i18n.language, t, retryCount]);

  // Auto-fill OCR language based on browser language when languages are loaded
  useEffect(() => {
    const shouldAutoFillLanguage =
      autoFillFromBrowserLanguage &&
      !isLoadingLanguages &&
      !loadFailed &&
      availableLanguages.length > 0 &&
      !hasAutoFilled &&
      value.length === 0;

    if (shouldAutoFillLanguage) {
      // Use the comprehensive language mapping from languageMapping.ts
      const suggestedOcrLanguages = getAutoOcrLanguage(i18n.language);

      if (suggestedOcrLanguages.length > 0) {
        // Find the first suggested language that's available in the backend
        const matchingLanguage = availableLanguages.find((lang) =>
          suggestedOcrLanguages.includes(lang.value),
        );

        if (matchingLanguage) {
          onChange([matchingLanguage.value]);
        }
      }

      setHasAutoFilled(true);
    }
  }, [
    autoFillFromBrowserLanguage,
    isLoadingLanguages,
    loadFailed,
    availableLanguages,
    hasAutoFilled,
    value.length,
    i18n.language,
    onChange,
  ]);

  if (isLoadingLanguages) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Loader size="xs" />
        <Text size="sm">
          {t("ocr.languagePicker.loading", "Loading available languages...")}
        </Text>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div role="alert">
        <Text size="sm">
          {t(
            "ocr.languagePicker.loadFailed",
            "Could not load OCR languages. Check your connection and try again.",
          )}
        </Text>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => setRetryCount((count) => count + 1)}
        >
          {t("ocr.languagePicker.retry", "Retry")}
        </Button>
      </div>
    );
  }

  const footer = (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        <Text size="xs" c="dimmed" className="text-center">
          {t(
            "ocr.languagePicker.additionalLanguages",
            "Looking for additional languages?",
          )}
        </Text>
        <Text
          size="xs"
          style={{
            color: "var(--c-accent-text)",
            cursor: "pointer",
            textDecoration: "underline",
            textAlign: "center",
          }}
          onClick={() =>
            window.open(
              "https://docs.stirlingpdf.com/Configuration/OCR",
              "_blank",
            )
          }
        >
          {t("ocr.languagePicker.viewSetupGuide", "View setup guide →")}
        </Text>
      </div>
    </>
  );

  if (availableLanguages.length === 0) {
    return (
      <div role="status">
        <Text size="sm">
          {t(
            "ocr.languagePicker.noneInstalled",
            "No OCR languages are installed. Add English language data to enable text recognition.",
          )}
        </Text>
        {footer}
      </div>
    );
  }

  return (
    <DropdownListWithFooter
      value={value}
      onChange={(newValue) => onChange(newValue as string[])}
      items={availableLanguages}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
      label={label}
      footer={footer}
      multiSelect={true}
      maxHeight={300}
      searchable={true}
    />
  );
};

export default LanguagePicker;
