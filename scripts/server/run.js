/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */


const script = {
  name: 'run',

  exec: async function (ctx, payload) {
    if (payload.action === 'run')
    {
      let result = {}
      if (payload.recipe)
      {



        const integration = ctx.app.integrations.get('workflow')
        const recipe = await integration.getWorkflow(payload.recipe.id, payload.recipe.version, ctx.userId, true)
        const jobService = ctx.app.services.get('jobs')
        const job = await jobService.startRecipe(recipe, ctx.sessionId, ctx.userId, payload.args, 0, 'system')

        result = await new Promise( (resolve, reject) => {
          console.log('waiting for job', job.jobId)
          ctx.app.events.once('jobs.job_finished_' + job.jobId).then( (job) => {
            resolve(job)
          })
        })
      }
      return {ok: true, result}
    }
    return {ok: false, error: 'unknown action'}
  }
};

export default script;
