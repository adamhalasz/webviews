declare namespace webviews {
	export class WebViews {
	    element: any;
	    interface: any;
	    path: string;
	    context: any;
	    private htmlFile;
	    private documents;
	    private loadEventHandler;
	    private isDebugEnabled;
	    constructor(webViewElementRef: any, folder: any, file: any);
	    set(key: string, value: any): void;
		get(key): any;
	    load(initialContext?: any): Promise<any>;
	    addScript(folderName: string, fileName: string, params?: any): Promise<any>;
	    addStyle(folderName: string, fileName: string): Promise<any>;
	    dispatch(): void;
		debug(value: boolean): void;
	    private loadEventHandlerWrapper(resolve, reject);
	}
}

export = webviews;