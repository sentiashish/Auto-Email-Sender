import * as XLSX from "xlsx";

export type EmailRecord = {
  email: string;
  data: Record<string, string>;
};

export type ParsedWorkbook = {
  headers: string[];
  records: EmailRecord[];
};

const EMAIL_KEYS = ["email", "e-mail", "mail", "gmail"];

const isCsvFile = (file: File) => file.name.toLowerCase().endsWith(".csv");

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return String(value).trim();
};

export function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  return (isCsvFile(file) ? file.text() : file.arrayBuffer()).then((input) => {
    const workbook = XLSX.read(input, { type: isCsvFile(file) ? "string" : "array" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("The uploaded file does not contain any sheets.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    if (rows.length === 0) {
      throw new Error("The first sheet is empty.");
    }

    const headers = Object.keys(rows[0] ?? {}).map((header) => header.trim());
    const emailHeader =
      headers.find((header) => EMAIL_KEYS.includes(header.toLowerCase())) ?? headers[0] ?? "";

    const records = rows
      .map((row) => {
        const normalizedRow = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim(), normalizeValue(value)]),
        );
        const email = normalizeValue(normalizedRow[emailHeader] ?? "");

        return {
          email,
          data: normalizedRow,
        };
      })
      .filter((record) => record.email.length > 0);

    if (records.length === 0) {
      throw new Error("No email addresses were found in the first sheet.");
    }

    return {
      headers,
      records,
    };
  });
}

export function previewTemplate(template: string, data: Record<string, string>) {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
    const value = data[key.trim()];
    return value?.length ? value : "";
  });
}