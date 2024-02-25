import {SuggestModal, App} from 'obsidian'
import {IJiraInstanceUrl} from '../Models/JiraInstanceUrl'

export class JiraInstanceSuggestModal extends SuggestModal<IJiraInstanceUrl> {
	items: IJiraInstanceUrl[]
	onSubmit: (result: IJiraInstanceUrl) => void;

	/**
	 * @private
	 */
	untitledInstanceCounter = 0;

	constructor(app: App, items: IJiraInstanceUrl[], onSubmit: (result: IJiraInstanceUrl) => void){
		super(app)
		this.items = items;
		this.onSubmit = onSubmit;
		this.inputEl.addEventListener('keydown', () => {
			this.untitledInstanceCounter = 0;
		})
	}
	getSuggestions(query: string): IJiraInstanceUrl[] | Promise<IJiraInstanceUrl[]> {
		// Create new items to ensure instance titles are filled
		const newItems = this.items.map(x => {
			return (
				{
					IsDefault: x.IsDefault,
					Url: x.Url,
					Title: x.Title === '' ? `Instance ${(this.untitledInstanceCounter++)}` : x.Title
				}
			)
		})
		
		// Filter based on input
		return newItems.filter(x => 
			x.Title.toLowerCase().contains(query.toLowerCase()) || 
			x.Url.toLowerCase().contains(query.toLowerCase())
		);
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
