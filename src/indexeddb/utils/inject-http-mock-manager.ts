export async function injectHttpMockManager(jsRurl: string,container:HTMLElement){

    if(!document.querySelector('script[src="'+jsRurl+'"]')){
        await new Promise<void>((resolve,reject)=>{
            const script=document.createElement('script');
            script.src=jsRurl;
            script.onload=()=>resolve();
            script.onerror=()=>reject(new Error('Failed to load script: '+jsRurl));
            document.head.appendChild(script);  
        })
    }

    if(!container.querySelector('.http-mock-manager')){
        container.appendChild(document.createElement('http-mock-manager'));
    }
}    