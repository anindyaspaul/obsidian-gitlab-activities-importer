function buildDateFromParts(year: number, month: number, day: number): Date | null {
	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year
		|| date.getMonth() !== month - 1
		|| date.getDate() !== day
	) {
		return null;
	}

	return date;
}

export function extractDailyNoteDateFromBasename(basename: string): Date | null {
	const dashedDateMatch = basename.match(/(\d{4})-(\d{2})-(\d{2})/);
	if (dashedDateMatch) {
		const [, yearText, monthText, dayText] = dashedDateMatch;
		const year = Number(yearText);
		const month = Number(monthText);
		const day = Number(dayText);
		return buildDateFromParts(year, month, day);
	}

	const compactDateMatch = basename.match(/(\d{4})(\d{2})(\d{2})/);
	if (compactDateMatch) {
		const [, yearText, monthText, dayText] = compactDateMatch;
		const year = Number(yearText);
		const month = Number(monthText);
		const day = Number(dayText);
		return buildDateFromParts(year, month, day);
	}

	return null;
}

export function formatDateAsYyyyMmDd(date: Date): string {
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
