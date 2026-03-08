import {requestUrl} from "obsidian";
import {GitlabActivityEvent, GitlabRawEvent} from "./types";

interface FetchGitlabEventsForDateParams {
	baseUrl: string;
	privateToken: string;
	date: string;
	perPage: number;
	maxPages: number;
}

function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, "");
}

function parseEventsPayload(payload: unknown): GitlabRawEvent[] {
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload as GitlabRawEvent[];
}

function mapEvent(rawEvent: GitlabRawEvent): GitlabActivityEvent {
	return {
		id: rawEvent.id,
		actionName: rawEvent.action_name,
		targetType: rawEvent.target_type,
		targetTitle: rawEvent.target_title,
		targetIid: rawEvent.target_iid,
		authorUsername: rawEvent.author_username,
		createdAt: rawEvent.created_at,
		projectId: rawEvent.project_id,
		pushData: rawEvent.push_data
	};
}

function toValidLocalDate(year: number, month: number, day: number): Date | null {
	const candidate = new Date(year, month - 1, day);
	if (
		candidate.getFullYear() !== year
		|| candidate.getMonth() !== month - 1
		|| candidate.getDate() !== day
	) {
		return null;
	}

	return candidate;
}

function formatDateAsYyyyMmDd(date: Date): string {
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function buildDayRange(dateText: string): { afterDate: string; beforeDate: string } {
	const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!dateMatch) {
		throw new Error("Invalid date format. Expected YYYY-MM-DD.");
	}

	const [, yearText, monthText, dayText] = dateMatch;
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);

	const dayStart = toValidLocalDate(year, month, day);
	if (!dayStart) {
		throw new Error("Invalid calendar date. Expected a real YYYY-MM-DD date.");
	}

	const previousDay = new Date(dayStart);
	previousDay.setDate(dayStart.getDate() - 1);

	const nextDay = new Date(dayStart);
	nextDay.setDate(dayStart.getDate() + 1);

	return {
		afterDate: formatDateAsYyyyMmDd(previousDay),
		beforeDate: formatDateAsYyyyMmDd(nextDay)
	};
}

async function fetchProjectName(baseUrl: string, privateToken: string, projectId: number): Promise<string | undefined> {
	const projectUrl = `${baseUrl}/api/v4/projects/${encodeURIComponent(String(projectId))}`;

	const projectResponse = await requestUrl({
		url: projectUrl,
		method: "GET",
		headers: {
			"PRIVATE-TOKEN": privateToken
		}
	});

	const payload = projectResponse.json as Record<string, unknown>;
	const pathWithNamespace = payload.path_with_namespace;
	return typeof pathWithNamespace === "string" ? pathWithNamespace : undefined;
}

async function enrichProjectNames(
	baseUrl: string,
	privateToken: string,
	events: GitlabActivityEvent[]
): Promise<GitlabActivityEvent[]> {
	const uniqueProjectIds = Array.from(new Set(events
		.map(event => event.projectId)
		.filter((projectId): projectId is number => projectId !== undefined)));

	if (uniqueProjectIds.length === 0) {
		return events;
	}

	const projectNameEntries = await Promise.all(uniqueProjectIds.map(async (projectId) => {
		try {
			const projectName = await fetchProjectName(baseUrl, privateToken, projectId);
			return [projectId, projectName] as const;
		} catch {
			return [projectId, undefined] as const;
		}
	}));

	const projectNameById = new Map<number, string | undefined>(projectNameEntries);

	return events.map(event => ({
		...event,
		projectName: event.projectId !== undefined ? projectNameById.get(event.projectId) : undefined
	}));
}

export async function fetchGitlabEventsForDate(params: FetchGitlabEventsForDateParams): Promise<GitlabActivityEvent[]> {
	const sanitizedBaseUrl = normalizeBaseUrl(params.baseUrl);
	const boundedPerPage = Math.min(100, Math.max(1, Math.floor(params.perPage)));
	const boundedMaxPages = Math.max(1, Math.floor(params.maxPages));
	const dayRange = buildDayRange(params.date);

	const allEvents: GitlabActivityEvent[] = [];
	let currentPage = 1;

	for (let pageIndex = 0; pageIndex < boundedMaxPages; pageIndex += 1) {
		const endpoint = `${sanitizedBaseUrl}/api/v4/events`;
		const queryParams = new URLSearchParams({
			after: dayRange.afterDate,
			before: dayRange.beforeDate,
			per_page: String(boundedPerPage),
			page: String(currentPage),
			sort: "asc"
		});

		const response = await requestUrl({
			url: `${endpoint}?${queryParams.toString()}`,
			method: "GET",
			headers: {
				"PRIVATE-TOKEN": params.privateToken
			}
		});

		const rawEvents = parseEventsPayload(response.json);
		allEvents.push(...rawEvents.map(mapEvent));

		const nextPageHeader = response.headers["x-next-page"];
		if (!nextPageHeader) {
			if (rawEvents.length < boundedPerPage) {
				break;
			}

			currentPage += 1;
			continue;
		}

		const nextPage = Number(nextPageHeader);
		if (!Number.isFinite(nextPage) || nextPage <= currentPage) {
			break;
		}

		currentPage = nextPage;
	}

	const enrichedEvents = await enrichProjectNames(sanitizedBaseUrl, params.privateToken, allEvents);
	return enrichedEvents.sort((leftEvent, rightEvent) => leftEvent.createdAt.localeCompare(rightEvent.createdAt));
}
