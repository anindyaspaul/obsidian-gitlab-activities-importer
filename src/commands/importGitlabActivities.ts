import {MarkdownView, Notice} from "obsidian";
import GitLabActivitiesImporterPlugin from "../main";
import {formatActivitiesMarkdown} from "../import/formatActivities";
import {replaceOrAppendSection} from "../import/writeToNote";
import {fetchGitlabEventsForDate} from "../gitlab/client";
import {extractDailyNoteDateFromBasename, formatDateAsYyyyMmDd} from "../utils/dailyNoteDate";

function validateSettings(plugin: GitLabActivitiesImporterPlugin): string | null {
	if (!plugin.settings.personalAccessToken) {
		return "GitLab personal access token is missing. Add it in plugin settings.";
	}

	if (!plugin.settings.gitlabBaseUrl) {
		return "GitLab base URL is missing. Add it in plugin settings.";
	}

	return null;
}

export async function importGitlabActivitiesIntoActiveNote(plugin: GitLabActivitiesImporterPlugin): Promise<void> {
	const validationError = validateSettings(plugin);
	if (validationError) {
		new Notice(validationError);
		return;
	}

	const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!activeView?.file) {
		new Notice("Open a daily note first, then run the import command.");
		return;
	}

	const parsedDate = extractDailyNoteDateFromBasename(activeView.file.basename);
	if (!parsedDate) {
		new Notice("Could not determine date from note title. Expected YYYY-MM-DD or YYYYMMDD in the file name.");
		return;
	}

	const dateText = formatDateAsYyyyMmDd(parsedDate);

	try {
		const events = await fetchGitlabEventsForDate({
			baseUrl: plugin.settings.gitlabBaseUrl,
			privateToken: plugin.settings.personalAccessToken,
			date: dateText,
			perPage: plugin.settings.perPage,
			maxPages: plugin.settings.maxPages
		});

		const output = formatActivitiesMarkdown({
			dateText,
			events,
			baseUrl: plugin.settings.gitlabBaseUrl
		});

		await replaceOrAppendSection({
			app: plugin.app,
			file: activeView.file,
			heading: plugin.settings.outputHeading,
			content: output
		});

		new Notice(`Imported ${events.length} GitLab activities for ${dateText}.`);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		new Notice(`Failed to import GitLab activities: ${message}`);
	}
}
