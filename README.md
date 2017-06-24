![WebViews Icon](http://i.imgur.com/Qwba5TC.png)

# WebViews
An Angular2 NativeScript WebView Module that works on iOS and Android as well.

## Requirements
- NativeScript 3.0.1
- Angular 2+
- Typescript 2.2.2

## Features
- Template Bindings with Handlebars
- Bi Directional communication between the WebView and the Parent NativeScript Component
- Works on real iOS Devices as well not just the emulator

## Install
```
npm install webviews --save
```

or:

```
tns plugin add webviews
```


# Usage

```ts
// ~/myProject/app/MyComponent/MyComponent.component.ts
import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { WebViews } from 'webviews';

@Component({
    template: `
        <GroupLayout>
            <WebView #webView></WebView>
        </GroupLayout>
    `
})

export class MyComponent implements OnInit, OnDestroy  {
    // Get an Element Reference to a WebView Directive
    @ViewChild('webView') WebViewElement: ElementRef;

    // Variable for the WebView Service Instance
    webview: any;

    ngOnInit(): void {
        // Create WebView Service Instance
        this.webview = new WebView(this.webViewElement, 'www', 'index.html')
        
        // Set context paramaeter
        this.webview.set('name', 'John Doe');

        // Load WebView Template
        this.webview.load().then(() => {
            this.webview.interface.emit('init', 'hello from the parent')
            this.webview.interface.on('message', (message) => {
                alert(message);
            })
        })
    }

    ngOnDestroy(): void {
        this.webview.dispatch();
    }
}
```

```html 
<!-- ~/myProject/app/www/index.html -->
<h1>Hello {{name}}!</h1>
<script>
    window.onload = function(){
        var webViewInterface = window.nsWebViewInterface;

        webViewInterface.emit('message', 'loading')
        webViewInterface.on('update', function(message){
            alert(message);
        })
    }
</script>

<!--
Result:
<h1>Hello John Doe</h1>
-->
```

# API

## WebView Class

### var webViewInstance = new WebViews(webViewElementRef: any, folder: any, file: any)

- **webViewElementRef**: An ElementRef object from @ViewChild
- **folder**: The folder name where the html file is located
- **file**: The name of the html file to load within the folder 

## WebView Instance Parameters

### webview.interface
An Object that containing methods that allow bi-directional communication between the Web View and the nativescript parent.

#### webview.interface.on(eventName: string, callback: Function): void
Listen on events

- **eventName**: The event name to listen to
- **eventData**: A callback function that gets called when it is emitted

#### webview.interface.emit(eventName: string, eventData: any): void
- **eventName**: The event name to listen to
- **eventData**: Data to send to the listener callback

## WebView Instance Methods

### webview.set(key: string, value: any): void
Set context parameter

- **key**: The context parameter name
- **value**: The context parameter value 

Usage in TypeScript:
```ts
// in ts
webview.set('name', 'John Doe')
```
HTML File:
```html
<!-- in html -->
<h1>Hello {{name}}</h1>
```
Will Become:
```html
<h1>Hello John Doe</h1>
```
### webview.load(initialContext?: any): Promise <any>
Load the HTML File. 

- **initialContext**: An object that sets context parameters. 

### webview.addScript(folderName: string, fileName: string, params?: any):  Promise <any>
Attach a Script

- **folderName**: The folder name where the script is located
- **fileName**: The script file name to load within the folder 
- **params**: An array of key-value objects for settings parameters on the script tag 

### webview.addStyle(folderName: string, fileName: string, params?: any):  Promise <any>
Attach a Stylesheet

- **folderName**: The folder name where the stylesheet is located
- **fileName**: The stylesheet file to load within the folder 

### webview.dispatch(): void
Dispatch Event Listeners. This method should be called within `ngOnDestroy` event in a component.


# License
MIT License

Copyright (c) 2017 Adam Halasz mail@adamhalasz.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
