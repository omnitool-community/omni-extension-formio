/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */


const script = {
  name: 'get',

  exec: async function (ctx, payload) {


    if (payload.schema)
    {
      console.log("schema", payload.schema)

      const integration = ctx.app.integrations.get('workflow')
      let recipe = await integration.getWorkflow(payload.recipe.id, payload.recipe.version, ctx.userId, true)
      let  ui = Object.values(recipe.rete.nodes).find((n) => n.name === 'omni-extension-formio:formio.auto_ui')
      ui.data.source = payload.schema

      recipe = await integration.updateWorkflow (
        payload.recipe.id,
        { rete: recipe.rete },
        ctx.userId
      )
        ui = Object.values(recipe.rete.nodes).find((n) => n.name === 'omni-extension-formio:formio.auto_ui')
        const pl = { type: 'control:setvalue', node_id: ui.id, controlId: 'source', value: ui.data.source, componentKey: ui.name, sessionId: ctx.sessionId }
        // ctx.app.verbose('SSE:control:setValue', payload)
        await ctx.app.emit('sse_message', pl)


      console.log(JSON.stringify(recipe.rete, null, 2))

      return {ok: true, recipe: recipe}
    }
    return {ok: false, error: 'missing parameter'}
  }
};

export default script;
