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

function formatProjectLabel(event: GitlabActivityEvent, baseUrl: string): string {
	if (event.projectName && event.projectWebUrl) {
		return `[${event.projectName}](${event.projectWebUrl})`;
	}

	if (event.projectName) {
		return event.projectName;
	}

	if (event.projectWebUrl) {
		return `[project](${event.projectWebUrl})`;
	}

	if (event.projectId !== undefined) {
		const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
		return `[project](${normalizedBaseUrl}/projects/${event.projectId})`;
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

function formatEventLine(event: GitlabActivityEvent, baseUrl: string): string {
	const timeText = formatTime(event.createdAt);
	const projectLabel = formatProjectLabel(event, baseUrl);

	if (event.pushData) {
		const commitMessage = event.pushData.commit_title?.trim() || "Commit message unavailable";
		const username = event.authorUsername ? `@${event.authorUsername}` : "Unknown user";
		const branch = event.pushData.ref ? stripRefPrefix(event.pushData.ref) : "unknown branch";
		return `- ${timeText} - **${commitMessage}** - ${username} pushed to ${projectLabel} in ${branch}`;
	}

	const actionText = event.actionName || "did";
	const targetLabel = formatTargetLabel(event, baseUrl);
	const username = event.authorUsername ? `@${event.authorUsername}` : "Unknown user";
	return `- ${timeText} - ${username} ${actionText} in ${projectLabel} (${targetLabel})`;

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
		lines.push(formatEventLine(event, params.baseUrl));
	}

	return lines.join("\n");
}
