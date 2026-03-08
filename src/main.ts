import {Plugin} from "obsidian";
import {importGitlabActivitiesIntoActiveNote} from "./commands/importGitlabActivities";
import {
	DEFAULT_SETTINGS,
	GitLabActivitiesImporterSettings,
	GitLabActivitiesImporterSettingTab
} from "./settings";

export default class GitLabActivitiesImporterPlugin extends Plugin {
	settings: GitLabActivitiesImporterSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "import-gitlab-activities-into-current-daily-note",
			name: "Import GitLab activities into current daily note",
			callback: async () => {
				await importGitlabActivitiesIntoActiveNote(this);
			}
		});

		this.addSettingTab(new GitLabActivitiesImporterSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<GitLabActivitiesImporterSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
