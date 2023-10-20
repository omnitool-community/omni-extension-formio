import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import ejs from 'ejs';
import fs from 'fs';


const ejsPlugin = {
    name: 'ejs-loader',
    setup(build) {
      build.onLoad({ filter: /\.ejs$/ }, async (args) => {
        const templateString = await fs.promises.readFile(args.path, 'utf-8');
        
        // For the sake of this example, let's assume that you're not passing any data to the EJS template.
        // If you need to, you'll need to adjust this.
        const renderedContent = ejs.render(templateString);
  
        // Convert the rendered content to a module that exports the rendered string.
        const jsCode = `export default ${JSON.stringify(renderedContent)};`;
     
        return {
          contents: jsCode,
          loader: 'js',
        };
      });
    },
  };


console.log("Building ....")
await esbuild.build({
    entryPoints: ['./main.ts','render.ts'],
    bundle: true,
    platform: 'browser',
    target: ['es2020'],
    format: 'esm',
    color: true,
    loader: {
        '.png': 'file',
        '.woff': 'file',
        '.woff2': 'file',
    },
    outdir: '../../public/',
    plugins: [ejsPlugin, sassPlugin({
        type: 'css',
    })],
}).catch((ex) =>
{
    console.error(ex)
    process.exit(1)
}).then(() =>
console.log("Build complete")
)