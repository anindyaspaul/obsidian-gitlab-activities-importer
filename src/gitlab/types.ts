export interface GitlabPushData {
	action?: string;
	ref?: string;
	commit_count?: number;
	commit_from?: string;
	commit_to?: string;
	commit_title?: string;
}

export interface GitlabRawEvent {
	id: number;
	action_name: string;
	target_type: string | null;
	target_title: string | null;
	target_iid?: number;
	author_username?: string;
	created_at: string;
	project_id?: number;
	push_data?: GitlabPushData;
}

export interface GitlabActivityEvent {
	id: number;
	actionName: string;
	targetType: string | null;
	targetTitle: string | null;
	targetIid?: number;
	authorUsername?: string;
	createdAt: string;
	projectId?: number;
	projectName?: string;
	projectWebUrl?: string;
	pushData?: GitlabPushData;
}
