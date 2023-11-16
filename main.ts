import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface LocalSettings {
	jira_instance_url: string;
	local_issue_path: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
	jira_instance_url: '',
	local_issue_path: ''
}

export default class JiraLinkerPlugin extends Plugin {
	settings: LocalSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can link a Jira issue to the local Jira instance
		this.addCommand({
			id: 'cmd-link-jira-issue',
			name: 'Link Jira issue',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const jira_url = this.settings.jira_instance_url;
				const content = editor.getSelection();

				// Check Jira URL
				if (jira_url == ''){
					const msg = 'The Jira URL has not been set in settings'
					new Notice(msg)
					return;
				}

				// Check for content, ask for it if not selected
				if (content == ''){
					new JiraIssueInputModal(this.app, (result) => {
						if (result !== ''){
							editor.replaceSelection(`[${result}](${jira_url}/browse/${result})`);
						}
					}).open();
				} else {
					editor.replaceSelection(`[${content}](${jira_url}/browse/${content})`);
				}
			}
		});

		// This adds an editor command that can link a Jira issue to a local issue _Info page
		this.addCommand({
			id: 'cmd-link-jira-issue-info',
			name: 'Link Jira issue to info',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const local_issue_path = this.settings.local_issue_path;
				const content = editor.getSelection();

				if (content == ''){
					new JiraIssueInputModal(this.app, (result) => {
						if (result !== ''){
							editor.replaceSelection(`[[${local_issue_path}/${result}/_Info|${result}]]`);
						}
					}).open();
				} else {
					// Replace content with local _Issue relative path
					editor.replaceSelection(`[[${local_issue_path}/${content}/_Info|${content}]]`);
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new JiraLinkerSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class JiraIssueInputModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Enter your Jira issue" });
		contentEl.createEl("p", {text: 'Enter an issue number which will then be appended to your Jira instance url'})

		new Setting(contentEl)
		.setName("Jira Issue")
		.addText((text) =>
			text.onChange((value) => {
			this.result = value
			}));

		new Setting(contentEl)
		.addButton((btn) =>
			btn
			.setButtonText("Link Issue")
			.setCta()
			.onClick(() => {
				this.close();
				this.onSubmit(this.result);
			}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class JiraLinkerSettingTab extends PluginSettingTab {
	plugin: JiraLinkerPlugin;

	constructor(app: App, plugin: JiraLinkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Jira Instance URL')
			.setDesc('The domain URL for your Jira instance')
			.addText(text => text
				.setPlaceholder('Jira URL')
				.setValue(this.plugin.settings.jira_instance_url)
				.onChange(async (value) => {
					if (value.endsWith('/')) {
						value = value.slice(0, -1);
					}
					this.plugin.settings.jira_instance_url = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Local Issue Path')
			.setDesc('The relative path to your issue folder')
			.addText(text => text
				.setPlaceholder('Relative issue path')
				.setValue(this.plugin.settings.local_issue_path)
				.onChange(async (value) => {
					if (value.endsWith('/')) {
						value = value.slice(0, -1);
					}
					this.plugin.settings.local_issue_path = value;
					await this.plugin.saveSettings();
				}));
	}
}
