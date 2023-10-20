/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */

//import './css/bootstrap-icons_font_bootstrap-icons.css'
import {OmniSDKClient} from 'omni-sdk';
const sdk = new OmniSDKClient("omni-extension-formio").init();
import './reset.css'
import './node_modules/bootstrap/dist/css/bootstrap.min.css'
import './node_modules/@formio/js/dist/formio.form.min.js'
//import './node_modules/@formio/js/dist/formio.form.min.css'
import  './node_modules/@formio/js/dist/formio.full.min.css'
import './style.css'

//@ts-ignore
import { Formio, Providers } from '@formio/js';
import ImageDraw from './ImageDraw.mjs';
import FidStorage from './FidStorageProvider.mjs'

import Base64Storage from './FixedBase64Provider.mjs'


Providers.addProvider("storage","b64-fixed-storage-provider",Base64Storage)

Providers.addProvider("storage","fid-storage-provider",FidStorage)
//@ts-ignore
import template from './ImageDraw.ejs';
Formio.use({components: {
  imagedraw: ImageDraw},
  templates:
  {
    imagedraw: template
  }
})


declare global {
  interface Window {

  }
}



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




//const myForm = JSON.parse(window.localStorage.getItem('test-form') || "{}")


const build = async () => {

  const result =  (await sdk.runExtensionScript('recipe',  {recipe:sdk.args.recipe}))

  const ui:any = Object.values(result.recipe.rete.nodes).find((n:any) => n.name === 'omni-extension-formio:formio.auto_ui')
  const myForm: any = typeof (ui.data.source) === 'string' ? JSON.parse(ui.data.source ||  {}) : ui.data.source ||  {}


  const theForm = await Formio.createForm(document.getElementById('formio'), myForm);

  theForm.on('submit', async (ev) => {

    const args = ev.data
    delete args.submit

    console.log("args",args)

    const payload:any = {
      action: 'run',
      args: args
    }
    if (sdk.args.recipe)  payload.recipe = { id: sdk.args.recipe.id, version: sdk.args.recipe.version }
    if (sdk.args.block)  payload.block = { id: sdk.args.block.name}
    //this.busy = true
    const result = await sdk.runExtensionScript('run',  payload)
    if (result.ok)
    {

      const jobId = result.result[0]?.id
      if (jobId)
      {
        sdk.showExtension('omni-core-filemanager', {jobId: jobId, expiryType: 'any'}, undefined, {winbox: {title: 'Job Results ' + jobId }, sigletonHash: 'job-results-' + jobId})
      }
    }
    //this.busy = false
    console.log(JSON.stringify(ev,null, 2))
    //reset the form
    theForm.submission = {data: args}
    theForm.emit('submitDone');


  });
}

build()