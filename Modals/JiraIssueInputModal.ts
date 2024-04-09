import { App, Modal, Setting } from "obsidian";

export class JiraIssueInputModal extends Modal {
	title: string;
	description: string;
	insert_newline_on_insert: boolean;
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, insert_newline_on_insert: boolean, onSubmit: (result: string) => void) {
		super(app);
		this.title = 'Enter your Jira issue';
		this.description = 'Type in a jira issue number';
		this.insert_newline_on_insert = insert_newline_on_insert;
		this.onSubmit = onSubmit;
		this.containerEl.addEventListener('keydown', (e) =>{
			if (e.key === 'Enter') {
				if (this.result !== undefined && this.result !== ''){
					if (!insert_newline_on_insert){
						e.preventDefault();
					}
					this.close();
					this.onSubmit(this.result);
				}
			} else if (e.key == 'Escape') {
				this.close();
			}
		});
	}

	setTitle(newTitle: string): JiraIssueInputModal {
		this.title = newTitle;
		return this;
	}

	setDescription(newDescription: string): JiraIssueInputModal {
		this.description = newDescription;
		return this;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: this.title });
		contentEl.createEl("p", {text: this.description})

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
