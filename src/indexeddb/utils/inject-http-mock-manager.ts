export async function injectHttpMockManagerFromUrl(jsRurl: string,container:HTMLElement){

    if(!document.querySelector('script[src="'+jsRurl+'"]')){
        await new Promise<void>((resolve,reject)=>{
            const script=document.createElement('script');
            script.src=jsRurl;
            script.onload=()=>resolve();
            script.onerror=()=>reject(new Error('Failed to load script: '+jsRurl));
            document.head.appendChild(script);  
        })
    }

    if(!container.querySelector('http-mock-manager')){
        container.appendChild(document.createElement('http-mock-manager'));
    }
}

import { HTTP_MOCK_MANAGER_SCRIPT } from './http-mock-manager-script';

export async function injectHttpMockManagerInline(container:HTMLElement){
    // Add the custom element to the container first if not already present
    if(!container.querySelector('http-mock-manager')){
        container.appendChild(document.createElement('http-mock-manager'));
    }

    // Check if script has already been injected
    const scriptId = 'http-mock-manager-inline-script';
    if(!document.querySelector(`script[id="${scriptId}"]`)){
        // Wait for next tick to ensure element is in DOM
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Create script element with inline content
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.textContent = HTTP_MOCK_MANAGER_SCRIPT;
        
        // Append script to document head
        document.head.appendChild(script);
        
        // Wait for script to execute
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
