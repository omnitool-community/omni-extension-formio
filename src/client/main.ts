/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */

//import './css/bootstrap-icons_font_bootstrap-icons.css'
import {OmniSDKClient} from 'omni-sdk';
const sdk = new OmniSDKClient("omni-extension-formio").init();
import './reset.css'
import './node_modules/bootstrap/dist/css/bootstrap.min.css'
import  './node_modules/@formio/js/dist/formio.full.min.css'
import './style.css'
//@ts-ignore
import { Formio,Providers } from '@formio/js';
import ImageDraw from './ImageDraw.mjs';
import FidStorage from './FidStorageProvider.mjs'
import Base64Storage from './FixedBase64Provider.mjs'


Providers.addProvider("storage","b64-fixed-storage-provider",Base64Storage)

Providers.addProvider("storage","fid-storage-provider",FidStorage)

//@ts-ignore
import template from './ImageDraw.ejs';
console.log(template)
const plugin =
{
  components: {
    imagedraw: ImageDraw},
    templates:
    {
      boostrap:
      {
        imagedraw: {
          form: template
        }
      }
  
    }
}

Formio.use(plugin) 


declare global {
  interface Window {
    ace: any;
    Ace: any;
    fioBuilder: any
    fioSave: any
  }
}


// ---------------------------------------------------------------------------------------------
// @formio/js downloads ACE if it's not found locally. Since we don't want to be internet
// dependent, we bundle it here.
// ---------------------------------------------------------------------------------------------
const Ace = require("ace-builds/src-noconflict/ace");
const modeHtmlFile = require("ace-builds/src-noconflict/mode-html.js");

Ace.config.setModuleUrl("ace/mode/html", modeHtmlFile);

const modeJsonFile = require("ace-builds/src-noconflict/mode-json.js");
Ace.config.setModuleUrl("ace/mode/json", modeJsonFile);

const xcodeFile = require("ace-builds/src-noconflict/theme-xcode.js");
Ace.config.setModuleUrl("ace/theme/xcode", xcodeFile);

const htmlWorkerFile = require("ace-builds/src-noconflict/worker-html.js");
Ace.config.setModuleUrl("ace/mode/html_worker", htmlWorkerFile);

const jsonWorkerFile = require("ace-builds/src-noconflict/worker-json.js");
Ace.config.setModuleUrl("ace/mode/json_worker", jsonWorkerFile);

Ace.config.set("basePath", "ace/");
Ace.config.set("loadWorkerFromBlob", false);

window.ace = Ace;
window.Ace = Ace;

 const form:any =  {

  builder: {

    premium: false,
    data: false,
    custom: {
      default: true,
      title: 'Recipe Inputs',
      weight: 0,
      components: {

      }
    },
    layout: {
      components: {
        table: true
      }
    }
  },
  editForm: {
    textfield: [
      {
        key: 'api',
        ignore: true
      }
    ]
  }
}


const addComponents = (components: any, form:any) =>
{

    Object.values(components).forEach((v:any) =>
    {
      addComponent(form, v)
      if (v.components)
      {
        addComponents(v.components, form)
      }
    })
}

const addComponent = (form:any, component:any) =>
{    
  const key = component.key
  if (['tabs', 'x-inputs', 'x-results'].includes(key))
  {
    return
  }

  form.builder.custom.components[key] =
  {
    title: component.label,
    key: component.key,
    icon: 'terminal',
    schema: component
  }

}

const boot = async () =>
{
  const result =  (await sdk.runExtensionScript('recipe',  {recipe:sdk.args.recipe}))

  const ui:any = Object.values(result.recipe.rete.nodes).find((n:any) => n.name === 'omni-extension-formio:formio.auto_ui')
  const data:any = ui.data.source  || {}

  addComponents(data.components, form)


//@ts-ignore
Formio.builder(document.getElementById('builder'), data,form).then(function(builder) {
window.fioBuilder = builder
builder.on('saveComponent', function() {



    console.log(builder.schema);
  });
});
}

window.fioSave = async ()=>
{
  const result =  (await sdk.runExtensionScript('saveEdits',  {recipe: sdk.args.recipe,  schema:window.fioBuilder.schema}))
}

boot()