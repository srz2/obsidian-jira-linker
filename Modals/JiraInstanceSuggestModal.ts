import {SuggestModal, App} from 'obsidian'
import {IJiraInstanceUrl} from '../Models/JiraInstanceUrl'

export class JiraInstanceSuggestModal extends SuggestModal<IJiraInstanceUrl> {
	items: IJiraInstanceUrl[]
	onSubmit: (result: IJiraInstanceUrl) => void;

	constructor(app: App, items: IJiraInstanceUrl[], onSubmit: (result: IJiraInstanceUrl) => void){
		super(app)
		this.items = items;
		this.onSubmit = onSubmit;
	}
	getSuggestions(query: string): IJiraInstanceUrl[] | Promise<IJiraInstanceUrl[]> {
		return this.items;
	}
	renderSuggestion(value: IJiraInstanceUrl, el: HTMLElement) {
		const div = el.createDiv()
		div.createEl('h1', {
			text: value.Title
		}).className = 'jira_instance_title'

		div.createEl('p', {
			text: value.Url
		}).className = 'jira_instance_url'
	}
	onChooseSuggestion(item: IJiraInstanceUrl, evt: KeyboardEvent | MouseEvent) {
		this.onSubmit(item);
		return item;
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
