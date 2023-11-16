import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface LocalSettings {
	jira_instance_url: string;
	local_issue_path: string;
	local_issue_info_file: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
	jira_instance_url: '',
	local_issue_path: '',
	local_issue_info_file: '_Info'
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
							const newStr = this.createWebUrl(jira_url, result)
							editor.replaceSelection(newStr);
						}
					}).open();
				} else {
					const newStr = this.createWebUrl(jira_url, content)
					editor.replaceSelection(newStr);
				}
			}
		});

		// This adds an editor command that can link a Jira issue to a local issue _Info page
		this.addCommand({
			id: 'cmd-link-jira-issue-info',
			name: 'Link Jira issue to info',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const local_issue_path = this.settings.local_issue_path;
				const local_issue_main_file = this.settings.local_issue_info_file;
				const content = editor.getSelection();

				// Check local issue path
				if (local_issue_path == ''){
					const msg = 'The local issue path has not been set in settings'
					new Notice(msg)
					return;
				}

				// Check local issue main file
				if (local_issue_main_file == ''){
					const msg = 'The local issue main file has not been set in settings'
					new Notice(msg)
					return;
				}

				if (content == ''){
					new JiraIssueInputModal(this.app, (result) => {
						if (result !== ''){
							const newStr = this.createLocalUri(local_issue_path, result, local_issue_main_file)
							editor.replaceSelection(newStr);
						}
					}).open();
				} else {
					// Replace content with local _Issue relative path
					const newStr = this.createLocalUri(local_issue_path, content, local_issue_main_file)
					editor.replaceSelection(newStr);
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new JiraLinkerSettingTab(this.app, this));
	}

	/**
	 * Create a URL for linking to Jira web instance
	 * @param {string} url The Jira instance
	 * @param {string} jira_issue The Jira issue number (e.g.: JIRA-123)
	 * @returns {string} A fully formed markdown Url representing a Jira with the issue as a label
	 */
	createWebUrl(url: string, jira_issue: string): string {
		const jira_url = this.settings.jira_instance_url;
		return `[${jira_issue}](${jira_url}/browse/${jira_issue})`
	}

	/**
	 * Create a Uri which points to a local file
	 * @param {string} local_path The local path for the local issues in obsidian
	 * @param {string} jira_issue The Jira issue number (e.g.: JIRA-123)
	 * @param {string} main_file_name The name of the main file
	 * @returns {string} A fully formed obsidian markdown Uri for referencing an issue
	 */
	createLocalUri(local_path: string, jira_issue: string, main_file_name: string) : string {
		return `[[${local_path}/${jira_issue}/${main_file_name}|${jira_issue}]]`
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
		this.containerEl.addEventListener('keydown', (e) =>{
			if (e.key === 'Enter') {
				if (this.result !== undefined && this.result !== ''){
					this.close();
					this.onSubmit(this.result);
				}
			} else if (e.key == 'Escape') {
				this.close();
			}
		});
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

		// Create description for "Local Issue Main File Name" Setting
		const settingMainFileNameDesc = document.createDocumentFragment();
		settingMainFileNameDesc.append(
			'The "Main" file name for linking to local issues (e.g.: ',
			settingMainFileNameDesc.createEl('i', {
				text: 'issues/JIRA-123/_Info'
			}),
			')'
		)
		new Setting(containerEl)
				.setName('Local Issue Main File Name')
				.setDesc(settingMainFileNameDesc)
				.addText(text => text
					.setPlaceholder('Local Issue Main File')
					.setValue(this.plugin.settings.local_issue_info_file)
					.onChange(async (value) => {
						this.plugin.settings.local_issue_info_file = value;
						await this.plugin.saveSettings();
					}));
	}
}
