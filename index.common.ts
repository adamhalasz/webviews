import * as webViewModule from "tns-core-modules/ui/web-view";
import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';
import * as fs from "tns-core-modules/file-system";
import * as webViewInterfaceModule from 'nativescript-webview-interface';
import * as Handlebars from 'handlebars';

export class WebViews {

    public element: any;
    public interface: any;
    public path: string;
    public context: any;

    private htmlFile: any; 
    private documents: any;
    private loadEventHandler: any;
    private isDebugEnabled: boolean = false;
    
    constructor(webViewElementRef, folder, file){
        this.element = webViewElementRef;
        this.documents = fs.knownFolders.currentApp();
        this.path = fs.path.join(this.documents.path, folder, file);
        if(this.isDebugEnabled) console.log('WebViewService: Path', this.path);
        this.htmlFile = this.documents.getFolder(folder).getFile(file);
        this.context = {
            scripts: [],
            styles: []
        }
    }

    public debug(value: boolean = true): void{
        this.isDebugEnabled = value;
    }

    public set(key: string, value: any): void {
        this.context[key] = value;
    }

    public get(key: string): any {
        return this.context[key];
    }
    
    public load(initialContext?: any): Promise <any> {
        if(initialContext){
            for(let index in initialContext){
                if(initialContext.hasOwnProperty(index)){
                    this.context[index] = initialContext;
                }
            }
        }
        return new Promise((resolve, reject) => {

            let webView: WebView = this.element.nativeElement;
            this.element = webView;
            webView.ios.scrollView.bounces = false;
            

            this.htmlFile.readText().then((content: string) => {
                //console.log('WebViewService: index.html content: {', content.replace(/\n/gi, '<br>'), '}');
                var contentBefore = `
                <!DOCTYPE html>
                    <html>
                        <head>
                            {{#each styles}}
                                <style>{{{ this }}}</style>
                            {{/each}}

                            {{#scripts}}
                                <script {{#params }} {{key}}="{{value}}" {{/params}}>{{{ content }}}</script>
                            {{/scripts}}
                        <head>
                        <body>`;

                        
                var contentAfter = '<body></html>';
                var finalContent = contentBefore + content + contentAfter;
                var template = Handlebars.compile(finalContent);

                var html = template(this.context);
                if(this.isDebugEnabled) console.log('WebView: context: ', this.context);
                if(this.isDebugEnabled) console.log('WebView: index.html content: {', html.replace(/\n/gi, '<br>'), '}');
                this.loadEventHandler = this.loadEventHandlerWrapper(resolve, reject);
                //console.log('eventHandler function', eventHandler);
                webView.on('loadFinished', this.loadEventHandler);
                this.interface = new webViewInterfaceModule.WebViewInterface(this.element, html);


            }).catch(err => {
                if(this.isDebugEnabled) console.error('WebView: Error reading index.html', err)
                reject(err);
            })
        })
    }

    public addScript(folderName: string, fileName: string, params?: any):  Promise <any> {
        var fileReference = this.documents.getFolder(folderName).getFile(fileName);
        return new Promise((resolve, reject) => {
            fileReference.readText().then((content: string) => {
                this.context.scripts.push({ content: content, params: params || [] });
                resolve();

            }).catch(err => {
                if(this.isDebugEnabled) console.log('WebView: Error reading index.html', err)
                reject(err);
            })
        })
    }

    public addStyle(folderName: string, fileName: string): Promise <any> {
        var fileReference = this.documents.getFolder(folderName).getFile(fileName);
        return new Promise((resolve, reject) => {
            fileReference.readText().then((content: string) => {
                this.context.styles.push(content);
                resolve();

            }).catch(err => {
                if(this.isDebugEnabled) console.log('WebView: Error reading index.html', err)
                reject(err);
            })
        })
    }

    public dispatch(): void {
        this.element.off(WebView.loadFinishedEvent, this.loadEventHandler);
    }

    private loadEventHandlerWrapper(resolve, reject): any {
        let loadedTimes = 0;
        if(this.isDebugEnabled) console.log('\nWebView: loadEventHandler called');
        return (args: webViewModule.LoadEventData) => {
            loadedTimes++;
            if(this.isDebugEnabled) console.log('\n WebView: loadEventHandler function within called #', loadedTimes);

            for(let index in args){
                if(this.isDebugEnabled) console.log('WebView: ARG', index, '=', args[index]);
            }

            let message;
            if (!args.error) {
                message = "WebView finished loading " + args.url;
                if(this.isDebugEnabled) console.log('WebView: webViewModule.WebView.loadFinishedEvent message', message);
            } else {
                message = "Error loading [" + args.url + "]: " + args.error;
                if(this.isDebugEnabled) console.log('WebView:  webViewModule.WebView.loadFinishedEvent message', message);
            }
            if(loadedTimes == 3) {
                resolve()
            }
        }
    }
}