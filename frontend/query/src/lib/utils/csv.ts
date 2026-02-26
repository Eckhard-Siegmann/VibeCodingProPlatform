/**
 * Client-side CSV export utility.
 * Per Ch.15.3.4: CSV format with UTF-8 BOM for Excel compatibility.
 * No server-side endpoint — generates from rendered data.
 *
 * Spec: Ch.15.3.4, A17
 */

/** UTF-8 BOM for Excel compatibility */
const UTF8_BOM = '\uFEFF';

/**
 * Escape a CSV field value per RFC 4180.
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 */
function escapeField(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

/**
 * Generate a CSV string from headers and rows.
 * Prepends UTF-8 BOM for Excel compatibility.
 *
 * @param headers - Column header labels
 * @param rows - Array of row arrays (values in header order)
 * @returns CSV string with BOM
 */
export function generateCsv(
	headers: string[],
	rows: Array<Array<string | number | null | undefined>>
): string {
	const headerLine = headers.map(escapeField).join(',');
	const dataLines = rows.map((row) => row.map(escapeField).join(','));
	return UTF8_BOM + [headerLine, ...dataLines].join('\r\n') + '\r\n';
}

/**
 * Trigger a browser download of a CSV string.
 *
 * @param csv - CSV content string (from generateCsv)
 * @param filename - Download filename (e.g., 'rating_results_2026-02-25.csv')
 */
export function downloadCsv(csv: string, filename: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Generate a filename following the convention: {view_name}_{ISO_date}.csv
 */
export function csvFilename(viewName: string): string {
	const date = new Date().toISOString().slice(0, 10);
	return `${viewName}_${date}.csv`;
}
