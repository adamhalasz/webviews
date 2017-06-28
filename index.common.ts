import * as webViewModule from "tns-core-modules/ui/web-view";
import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';
import * as fs from "tns-core-modules/file-system";
import * as webViewInterfaceModule from 'nativescript-webview-interface';
import * as Handlebars from 'handlebars';
import { isIOS, isAndroid } from "platform";
import * as colorModule from 'color';

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
            
            if(isIOS){
                webView.ios.scrollView.bounces = false;
                let translucent = new colorModule.Color("#00ff0000");
                this.element.ios.backgroundColor = translucent.ios;
                this.element.ios.opaque = false;
                
            } else if (isAndroid) {
                webView.android.setBackgroundColor(0x00000000);//android.graphics.Color.TRANSPARENT);//
                webView.android.setLayerType(webView.android.view.View.LAYER_TYPE_SOFTWARE, null);
            }

            this.htmlFile.readText().then((content: string) => {
                //console.log('WebViewService: index.html content: {', content.replace(/\n/gi, '<br>'), '}');
                var contentBefore = `
                <!DOCTYPE html>
                    <html>
                        <head>
                            {{#each styles}}
                                <style>{{{ this }}}</style>
                            {{/each}}

                            <script>
                                ${NSWebViewinterface}
                            </script>

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
            });
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

            var webview:WebView = <WebView>args.object;
            if(isAndroid){
                webview.android.getSettings().setDisplayZoomControls(false);
            }

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
            resolve()
        }
    }
}

var NSWebViewinterface = `
/*
 Extracted from  "nativescript-webiew-interface" module.
*/

/**
 * WebViewInterface class to handle communication between webView and Android/iOS.
 */
var NSWebViewinterface = (function () {
    function NSWebViewinterface() {
        
        /**
         * Mapping of native eventName and its handler in webView
         */
        this.eventListenerMap = {};
        
        /**
         * Mapping of JS Call responseId and result for iOS
         */
        this._iosResponseMap = {};
        
        /**
         * Counter of iOS JS Call responseId
         */
        this._iosCntResponseId = 0;
    }
    
    /**
     * Handles events/commands emitted by android/ios. This function is called from nativescript.
     * @param   {string}    eventName - Native event/command name
     * @param   {data}      data - Payload for the event/command
     */
    NSWebViewinterface.prototype._onNativeEvent = function (eventName, data) {
        var lstEvtListeners = this.eventListenerMap[eventName] || [];
        for (var _i = 0; _i < lstEvtListeners.length; _i++) {
            var listener = lstEvtListeners[_i];
            var retnVal = listener && listener(data);
            // if any handler return false, not executing any further handlers for that event.
            if (retnVal === false) {
                break;
            }
        }
    };
    
   /**
     * Handles JS function calls by android/ios. This function is called from nativescript.
     * Result value of JS function call can be promise or any other data.
     * @param   {number}    reqId - Internal communication id
     * @param   {string}    functionName - Function to be executed in webView
     * @param   {any[]}     args  
     */
    NSWebViewinterface.prototype._callJSFunction = function (reqId, functionName, args) {
        var _this = this;
        var resolvedFn = _this._getResolvedFunction(functionName);
        if(resolvedFn){
            var retnVal = resolvedFn.apply(window, args);
            if (retnVal && retnVal.then) {
                retnVal.then(function (value) {
                    _this._sendJSCallResponse(reqId, value);
                }, function(error){
                    _this._sendJSCallResponse(reqId, error, true);
                });
            }
            else {
                this._sendJSCallResponse(reqId, retnVal);
            }
        }
    }
    
    /**
     * Resolves a function, if the function to be executed is in deep object chain.
     * e.g If we want to execute a function 'parent.child.child.fn' from native app, 
     * this function will extract fn from the object chain. 
     * We can do it by using eval also, but as there is a way, why to invite unknown security risks? 
     * 
     */
    NSWebViewinterface.prototype._getResolvedFunction = function(functionName){
        if(functionName && (functionName = functionName.trim()).length){
            functionName = functionName.indexOf('window.') === 0 ? functionName.replace('window.', '') : functionName;
            var arrFnPath = functionName.split('.');
            var fn = window;
            for(var i =0; i < arrFnPath.length; i++){
                if(!fn[arrFnPath[i]]){
                    fn = null;
                    break;
                }
                fn = fn[arrFnPath[i]]; 
            }
            return fn;
        }
    }
    
    /**
     * Returns JS Call response by emitting internal _jsCallRespone event
     */
    NSWebViewinterface.prototype._sendJSCallResponse = function (reqId, response, isError) {
        var oResponse = {
            reqId: reqId,
            response: response || null,
            isError: !!isError
        };
        this.emit('_jsCallResponse', oResponse);
    };
    
    /**
     * Creates temporary iFrame element to load custom url, for sending handshake message 
     * to iOS which is necessary to initiate data transfer from webView to iOS
     */
    NSWebViewinterface.prototype._createIFrame = function (src) {
        var rootElm = document.documentElement;
        var newFrameElm = document.createElement("IFRAME");
        newFrameElm.setAttribute("src", src);
        rootElm.appendChild(newFrameElm);
        return newFrameElm;
    };
    
    /**
     * Sends handshaking signal to iOS using custom url, for sending event payload or JS Call response.
     * As iOS do not allow to send any data from webView. Here we are sending data in two steps.
     * 1. Send handshake signal, by loading custom url in iFrame with metadata (eventName, unique responseId)
     * 2. On intercept of this request, iOS calls _getIOSResponse with the responseId to fetch the data.
     */
    NSWebViewinterface.prototype._emitEventToIOS = function (eventName, data) {
        this._iosResponseMap[++this._iosCntResponseId] = data;
        var metadata = { eventName: eventName, resId: this._iosCntResponseId };
        var url = 'js2ios:' + JSON.stringify(metadata);
        var iFrame = this._createIFrame(url);
        iFrame.parentNode.removeChild(iFrame);
    };
    
    /**
     * Returns data to iOS. This function is called from iOS.
     */
    NSWebViewinterface.prototype._getIOSResponse = function (resId) {
        var response = this._iosResponseMap[resId];
        delete this._iosResponseMap[resId];
        return response;
    };
    
    /**
     * Calls native android function to emit event and payload to android
     */
    NSWebViewinterface.prototype._emitEventToAndroid = function (eventName, data) {
        window.androidWebViewInterface.handleEventFromWebView(eventName, data);
    };
    
    /**
     * Registers handlers for android/ios event/command
     */
    NSWebViewinterface.prototype.on = function (eventName, callback) {
        var lstListeners = this.eventListenerMap[eventName] || (this.eventListenerMap[eventName] = []);
        lstListeners.push(callback);
    };
    
    /**
     * Emits event to android/ios
     */
    NSWebViewinterface.prototype.emit = function (eventName, data) {
        var strData = typeof data === 'object' ? JSON.stringify(data) : data;
        if (window.androidWebViewInterface) {
            this._emitEventToAndroid(eventName, strData);
        }
        else {
            this._emitEventToIOS(eventName, strData);
        }
    };
    return NSWebViewinterface;
})();
window.nsWebViewInterface = new NSWebViewinterface();
`;