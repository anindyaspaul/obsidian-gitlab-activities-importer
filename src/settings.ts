import {App, PluginSettingTab, Setting} from "obsidian";
import GitLabActivitiesImporterPlugin from "./main";

export interface GitLabActivitiesImporterSettings {
	gitlabBaseUrl: string;
	personalAccessToken: string;
	outputHeading: string;
	perPage: number;
	maxPages: number;
}

export const DEFAULT_SETTINGS: GitLabActivitiesImporterSettings = {
	gitlabBaseUrl: "https://gitlab.com",
	personalAccessToken: "",
	outputHeading: "GitLab activities",
	perPage: 100,
	maxPages: 5
};

export class GitLabActivitiesImporterSettingTab extends PluginSettingTab {
	plugin: GitLabActivitiesImporterPlugin;

	constructor(app: App, plugin: GitLabActivitiesImporterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("GitLab base URL")
			.setDesc("Use https://gitlab.com for GitLab.com, or your self-managed GitLab URL.")
			.addText(text => text
				.setPlaceholder("https://gitlab.com")
				.setValue(this.plugin.settings.gitlabBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.gitlabBaseUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Personal access token")
			.setDesc("Token used with the private-token header. Minimum required scope: read_user.")
			.addText(text => {
				text.setPlaceholder("Paste token")
					.setValue(this.plugin.settings.personalAccessToken)
					.onChange(async (value) => {
						this.plugin.settings.personalAccessToken = value.trim();
						await this.plugin.saveSettings();
					});

				text.inputEl.type = "password";
			});

		new Setting(containerEl)
			.setName("Output heading")
			.setDesc("Section heading used in daily notes for imported activities.")
			.addText(text => text
				.setPlaceholder("GitLab activities")
				.setValue(this.plugin.settings.outputHeading)
				.onChange(async (value) => {
					this.plugin.settings.outputHeading = value.trim() || DEFAULT_SETTINGS.outputHeading;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Events per page")
			.setDesc("GitLab API page size. Maximum is 100.")
			.addText(text => text
				.setPlaceholder("100")
				.setValue(String(this.plugin.settings.perPage))
				.onChange(async (value) => {
					const parsedValue = Number(value);
					if (!Number.isFinite(parsedValue)) {
						return;
					}

					const clampedValue = Math.min(100, Math.max(1, Math.floor(parsedValue)));
					this.plugin.settings.perPage = clampedValue;
					await this.plugin.saveSettings();
					this.display();
				}));

		new Setting(containerEl)
			.setName("Maximum pages")
			.setDesc("Safety cap for pagination to avoid very large imports.")
			.addText(text => text
				.setPlaceholder("5")
				.setValue(String(this.plugin.settings.maxPages))
				.onChange(async (value) => {
					const parsedValue = Number(value);
					if (!Number.isFinite(parsedValue)) {
						return;
					}

					const clampedValue = Math.min(50, Math.max(1, Math.floor(parsedValue)));
					this.plugin.settings.maxPages = clampedValue;
					await this.plugin.saveSettings();
					this.display();
				}));
	}
}
