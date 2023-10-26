import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface LocalSettings {
	jira_instance_url: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
	jira_instance_url: ''
}

export default class JiraLinkerPlugin extends Plugin {
	settings: LocalSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'cmd-link-jira-issue',
			name: 'Link Jira issue',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const jira_url = this.settings.jira_instance_url;
				const content = editor.getSelection();

				// Check JIRA URL
				if (jira_url == ''){
					const msg = 'The JIRA URL has not been set in settings'
					console.warn(msg)
					new Notice(msg)
					return;
				}

				// Check for content, ask for it if not selected
				if (content == ''){
					console.debug('No content given, giving input modal');
					new JiraIssueInputModal(this.app, (result) => {
						if (result !== ''){
							console.debug('replace with user input', result)
							editor.replaceSelection(`[${result}](${jira_url}/browse/${result})`);
						}
					}).open();
				} else {
					console.debug('Replacing with selection')
					editor.replaceSelection(`[${content}](${jira_url}/browse/${content})`);
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

		contentEl.createEl("h1", { text: "Enter your JIRA Issue" });
		contentEl.createEl("p", {text: 'Enter your jira issue which will then be appended to your jira url'})

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
			.setDesc('The domain URL for your JIRA instance')
			.addText(text => text
				.setPlaceholder('JIRA URL')
				.setValue(this.plugin.settings.jira_instance_url)
				.onChange(async (value) => {
					if (value.endsWith('/')) {
						value = value.slice(0, -1);
					}
					this.plugin.settings.jira_instance_url = value;
					await this.plugin.saveSettings();
				}));
	}
}
