export interface IJiraInstanceUrl {
	Title: string,
	IsDefault: boolean,
	Url: string
}
export class JiraInstanceUrl implements IJiraInstanceUrl {
	Title: string;
	IsDefault: boolean;
	Url: string;

	constructor(url: string, title?: string){
		this.Title = title ? title : ""
		this.Url = url
		this.IsDefault = false
	}
}
