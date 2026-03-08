import {GitlabActivityEvent} from "../gitlab/types";

interface FormatActivitiesMarkdownParams {
	dateText: string;
	events: GitlabActivityEvent[];
	baseUrl: string;
}

function formatTime(isoTime: string): string {
	const date = new Date(isoTime);
	if (Number.isNaN(date.getTime())) {
		return "--:--";
	}

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	});
}

function stripRefPrefix(ref: string): string {
	return ref.replace(/^refs\/heads\//, "").replace(/^refs\/tags\//, "");
}

function formatProjectLabel(event: GitlabActivityEvent): string {
	if (event.projectName) {
		return `**${event.projectName}**`;
	}

	if (event.projectId !== undefined) {
		return `project #${event.projectId}`;
	}

	return "unknown project";
}

function formatTargetLabel(event: GitlabActivityEvent, baseUrl: string): string {
	const titleText = event.targetTitle?.trim();
	const targetTypeText = event.targetType ?? "item";

	if (!titleText) {
		return targetTypeText;
	}

	if (event.targetIid !== undefined && event.projectId !== undefined) {
		const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
		let targetPath = "";

		switch (event.targetType) {
			case "Issue":
				targetPath = `issues/${event.targetIid}`;
				break;
			case "MergeRequest":
				targetPath = `merge_requests/${event.targetIid}`;
				break;
			default:
				targetPath = "";
		}

		if (targetPath) {
			return `[${titleText}](${normalizedBaseUrl}/-/project/${event.projectId}/${targetPath})`;
		}
	}

	return `“${titleText}”`;
}

function formatPushDetails(event: GitlabActivityEvent): string[] {
	if (!event.pushData) {
		return [];
	}

	const pushLines: string[] = [];
	const ref = event.pushData.ref ? stripRefPrefix(event.pushData.ref) : null;
	const commitCount = event.pushData.commit_count;
	const commitTitle = event.pushData.commit_title;

	if (ref) {
		pushLines.push(`  - Branch: \`${ref}\``);
	}

	if (typeof commitCount === "number") {
		pushLines.push(`  - Commits in push: ${commitCount}`);
	}

	if (commitTitle) {
		pushLines.push(`  - Latest commit title: ${commitTitle}`);
	}

	if (pushLines.length === 0) {
		pushLines.push("  - Commit details were not provided by the events API payload.");
	}

	return pushLines;
}

function formatEventLine(event: GitlabActivityEvent, baseUrl: string): string[] {
	const eventLines: string[] = [];
	const timeText = formatTime(event.createdAt);
	const actionText = event.actionName || "did";
	const targetLabel = formatTargetLabel(event, baseUrl);
	const projectLabel = formatProjectLabel(event);
	const authorText = event.authorUsername ? ` by @${event.authorUsername}` : "";

	eventLines.push(`- ${timeText} • ${actionText}${authorText} in ${projectLabel} (${targetLabel})`);

	const pushDetails = formatPushDetails(event);
	eventLines.push(...pushDetails);

	return eventLines;
}

export function formatActivitiesMarkdown(params: FormatActivitiesMarkdownParams): string {
	if (params.events.length === 0) {
		return [
			`_No GitLab activities found for ${params.dateText}._`,
			"",
			`_Imported on ${new Date().toLocaleString()}._`
		].join("\n");
	}

	const lines: string[] = [
		`_Imported on ${new Date().toLocaleString()} for ${params.dateText}._`,
		"",
		"### Activities"
	];

	for (const event of params.events) {
		lines.push(...formatEventLine(event, params.baseUrl));
	}

	return lines.join("\n");
}
