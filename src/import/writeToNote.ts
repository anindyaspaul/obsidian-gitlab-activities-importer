import {App, TFile} from "obsidian";

interface ReplaceOrAppendSectionParams {
	app: App;
	file: TFile;
	heading: string;
	content: string;
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getHeadingLevel(line: string): number {
	const match = line.match(/^(#+)\s+/);
	if (!match || !match[1]) {
		return 0;
	}

	return match[1].length;
}

function buildSection(heading: string, content: string): string[] {
	return [
		`## ${heading}`,
		"",
		content.trim(),
		""
	];
}

export async function replaceOrAppendSection(params: ReplaceOrAppendSectionParams): Promise<void> {
	const existingContent = await params.app.vault.cachedRead(params.file);
	const lines = existingContent.split("\n");
	const headingPattern = new RegExp(`^##\\s+${escapeRegex(params.heading)}\\s*$`);

	const headingIndex = lines.findIndex(line => headingPattern.test(line));
	const nextSectionContent = buildSection(params.heading, params.content);

	if (headingIndex === -1) {
		const prefix = existingContent.trimEnd();
		const joiner = prefix.length === 0 ? "" : "\n\n";
		const updatedContent = `${prefix}${joiner}${nextSectionContent.join("\n")}`.trimEnd();
		await params.app.vault.modify(params.file, `${updatedContent}\n`);
		return;
	}

	const headingLine = lines[headingIndex];
	if (headingLine === undefined) {
		return;
	}

	const currentHeadingLevel = getHeadingLevel(headingLine);
	let nextSectionIndex = lines.length;

	for (let lineIndex = headingIndex + 1; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex];
		if (line === undefined) {
			continue;
		}

		const level = getHeadingLevel(line);
		if (level > 0 && level <= currentHeadingLevel) {
			nextSectionIndex = lineIndex;
			break;
		}
	}

	const updatedLines = [
		...lines.slice(0, headingIndex),
		...nextSectionContent,
		...lines.slice(nextSectionIndex)
	];

	await params.app.vault.modify(params.file, `${updatedLines.join("\n").trimEnd()}\n`);
}
