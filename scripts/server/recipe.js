/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */


const script = {
  name: 'get',

  exec: async function (ctx, payload) {


    if (payload.recipe)
    {

      const integration = ctx.app.integrations.get('workflow')
      const recipe = await integration.getWorkflow(payload.recipe.id, payload.recipe.version, ctx.userId, true)
      return {ok: true, recipe: recipe}
    }
    return {ok: false, error: 'missing parameter'}
  }
};

export default script;
