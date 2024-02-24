import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {JiraInstanceSuggestModal} from 'Modals/JiraInstanceSuggestModal'
import { JiraIssueInputModal } from 'Modals/JiraIssueInputModal';
import { IJiraInstanceUrl } from 'Models/JiraInstanceUrl';

interface LocalSettings {
	jira_instance_url: string;
	jira_instance_urls: IJiraInstanceUrl[];
	local_issue_path: string;
	local_issue_info_file: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
	/**
	 * @deprecated In version 1.0.X, this only supported one url,
	 * instead, use the jira_instance_urls array instead
	 */
	jira_instance_url: '',
	jira_instance_urls: [],
	local_issue_path: '',
	local_issue_info_file: '_Info'
}

export default class JiraLinkerPlugin extends Plugin {
	settings: LocalSettings;

	async onload() {
		await this.loadSettings();

		// Handling for if user used older versions containing only one url instance
		// this will load it to the array list
		if (this.settings.jira_instance_url !== ''){
			this.settings.jira_instance_urls.push({IsDefault: false, Title: '', Url: this.settings.jira_instance_url})
			await this.saveSettings();
		}

		// This adds an editor command that can link a Jira issue to the local Jira instance
		this.addCommand({
			id: 'cmd-link-jira-issue',
			name: 'Link Jira issue',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (this.settings.jira_instance_urls.length > 1) {
					// Get suggestion
					new JiraInstanceSuggestModal(this.app, this.settings.jira_instance_urls, (instance) => {
						this.insertJiraLink(instance.Url, editor)
					})
					.open()
				} else {
					this.insertJiraLink(this.settings.jira_instance_urls[0].Url, editor)
				}
			}
		});

		// This adds an editor command that can link a Jira issue to the local Jira instance
		this.addCommand({
			id: 'cmd-link-jira-issue-default-instance',
			name: 'Link Jira issue (default instance)',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				let didInsert = false;
				for(const item in this.settings.jira_instance_urls){
					this.insertJiraLink(item, editor)
					didInsert = true;
					break;
				}

				if (!didInsert){
					this.insertJiraLink(this.settings.jira_instance_urls[0].Url, editor)
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
					})
					.setDescription('Enter an issue number to be constructed into your local issue path')
					.open();
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

	insertJiraLink(jira_url: string, editor: Editor){
		// Check Jira URL
		if (jira_url == ''){
			const msg = 'The Jira URL has not been set in settings'
			new Notice(msg)
			return;
		}

		const content = editor.getSelection();

		// Check for content, ask for it if not selected
		if (content == ''){
			new JiraIssueInputModal(this.app, (result) => {
				if (result !== ''){
					const newStr = this.createWebUrl(jira_url, result)
					editor.replaceSelection(newStr);
				}
			})
			.setDescription('Enter an issue number which will then be appended to your Jira instance url')
			.open();
		} else {
			const newStr = this.createWebUrl(jira_url, content)
			editor.replaceSelection(newStr);
		}
	}

	/**
	 * Create a URL for linking to Jira web instance
	 * @param {string} url The Jira instance
	 * @param {string} jira_issue The Jira issue number (e.g.: JIRA-123)
	 * @returns {string} A fully formed markdown Url representing a Jira with the issue as a label
	 */
	createWebUrl(jira_url: string, jira_issue: string): string {
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

class JiraLinkerSettingTab extends PluginSettingTab {
	plugin: JiraLinkerPlugin;

	constructor(app: App, plugin: JiraLinkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		this.add_jira_instance_settings(containerEl);
		this.add_jira_local_issue_settings(containerEl);
	}

	add_jira_instance_settings(containerEl : HTMLElement) {
		new Setting(containerEl)
			.setName('Jira Instances')
			.setDesc('The domain URL for your Jira instances')

		this.plugin.settings.jira_instance_urls.forEach((url, index) => {
			const s = new Setting(containerEl);
			
			// Remove the name and description since we aren't using them. This
			// plus the css class `.setting-item-info:empty` will get us more space
			s.nameEl.remove();
			s.descEl.remove();

				// Conditionally add Default button
				if (!this.plugin.settings.jira_instance_urls[index].IsDefault){
					s.addButton((cb) => {
						cb.setButtonText("Unassign")
						cb.onClick(cb => {
							for (let c = 0; c < this.plugin.settings.jira_instance_urls.length; c++){
								this.plugin.settings.jira_instance_urls[c].IsDefault = false;
							}
							this.plugin.settings.jira_instance_urls[index].IsDefault = true;
							this.plugin.saveSettings();
							this.display();
						})
					})
				} else {
					s.addButton((cb) => {
						cb.setButtonText('Default')
						cb.buttonEl.className = 'assigned-default-button';
						cb.onClick(cb => {
							this.plugin.settings.jira_instance_urls[index].IsDefault = false;
							this.plugin.saveSettings();
							this.display();
						})
					})
				}

				s.addText((cb) => {
					cb.setPlaceholder('Add an optional title')
					cb.onChange(async (value) => {
						if (value === '') {
							value = `Instance ${index}`
						}
						this.plugin.settings.jira_instance_urls[index].Title = value
						await this.plugin.saveSettings();
					})
				})
				.addText((cb) => {
					cb.setPlaceholder('Example: https://myinstance.atlassian.net')
					cb.setValue(this.plugin.settings.jira_instance_urls[index].Url);
					cb.onChange(async (value) => {
						if (value.endsWith('/')) {
							value = value.slice(0, -1);
						}
						this.plugin.settings.jira_instance_urls[index].Url = value
						await this.plugin.saveSettings();
					})
					cb.inputEl.classList.add("setting_jira_instance_url")
				})
				.addExtraButton((cb) => {
					cb.setIcon('cross')
						.setTooltip('delete instance')
						.onClick(async () => {
							this.plugin.settings.jira_instance_urls.splice(index, 1);
							await this.plugin.saveSettings();
							// Force refresh display
							this.display();
						})
				})
		})
		
		new Setting(containerEl).addButton((cb) => {
			cb.setButtonText("Add new Jira instance")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.jira_instance_urls.push({
						Title: '',
						IsDefault: false,
						Url: ''
					});
					await this.plugin.saveSettings();
					// // Force refresh
					this.display();
				});
		});
	}

	add_jira_local_issue_settings(containerEl: HTMLElement) : void {
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
