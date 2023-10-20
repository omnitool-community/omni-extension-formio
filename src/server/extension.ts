/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */

import FormioBuilderComponent from "./Formio_ui.js";

let components = [FormioBuilderComponent];

export default {
  createComponents: () => ({
    blocks: components,
    patches: []
  })
}