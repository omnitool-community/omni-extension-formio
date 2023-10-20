// Formio_ui.ts
import { OAIBaseComponent, OmniComponentMacroTypes, OmniComponentFlags, BlockCategory as Category } from "omni-sockets";
function baseConvert(omniIO) {
  return {
    "label": omniIO.title || omniIO.name,
    "description": omniIO.description,
    "key": omniIO.name,
    "input": true,
    "defaultValue": omniIO.default
  };
}
function processChoices(choices) {
  if (Array.isArray(choices)) {
    return choices.map((choice) => {
      if (typeof choice === "string") {
        return { "label": choice, "value": choice };
      } else if (choice.value) {
        return { "label": choice.title || choice.value, "value": choice.value };
      } else {
        console.warn("Not implemented choice format");
      }
    });
  } else {
    throw new Error("Complex choice structures not yet supported.");
  }
}
function typeSpecificConvert(omniIO) {
  if (omniIO.choices) {
    return {
      "type": "select",
      "widget": "choicesjs",
      "tableView": true,
      "data": {
        "values": processChoices(omniIO.choices)
      }
    };
  }
  let type = null;
  let props = {};
  if (omniIO.customSocket) {
    switch (omniIO.customSocket) {
      case "image": {
        type = "file";
        props = {
          "applyMaskOn": "change",
          "capture": false,
          "fileTypes": [
            {
              "label": "",
              "value": ""
            }
          ],
          "image": true,
          "imageSize": "256",
          "input": true,
          // Default to the custom base64 storage provider
          "storage": "b64-fixed-storage-provider",
          "type": "file",
          "webcam": true
        };
      }
    }
  }
  switch (omniIO.type) {
    case "integer":
    case "float":
    case "number":
      return {
        ...props,
        "type": "number",
        "validate": {
          "min": omniIO.minimum,
          "max": omniIO.maximum
        }
      };
    case "string":
      return {
        ...props,
        "type": "textarea",
        "placeholder": omniIO.default
      };
    case "boolean":
      return {
        ...props,
        "type": "checkbox"
      };
    default:
      if (type) {
        return {
          ...props,
          type
        };
      }
      throw new Error(`No converter found for type: ${omniIO.type}`);
  }
}
function convertOmniIOToFormio(omniIO) {
  return {
    ...baseConvert(omniIO),
    ...typeSpecificConvert(omniIO)
  };
}
var component = OAIBaseComponent.create("formio", "auto_ui").fromScratch().set("description", `Create a custom user interface for your recipe via Form.io. Connect inputs from other blocks to its **UI Connector** to add elements, and press the **Generate Interface** to construct the UI. Toggle **Edit Form** for a full form-builder on connected elements. **Please note** that adding new connectors will reset the entire block.`).set("title", "Form.io Auto UI").set("category", Category.USER_INTERFACE).setFlag(OmniComponentFlags.UNIQUE_PER_WORKFLOW, true).setMethod("X-CUSTOM").setRenderTemplate("simple");
component.addControl(
  component.createControl("editMode", "boolean").set("title", "Edit Form").set("description", "Enable editing of the form").setControlType("AlpineToggleComponent").toOmniControl()
);
component.addControl(
  component.createControl("enableUI", "boolean").set("title", "Enable UI").set("description", "Enables / Disables the automatic popup of the UI").setDefault(true).setControlType("AlpineToggleComponent").toOmniControl()
);
component.addControl(
  component.createControl("source", "object").set("title", "Template").set("description", " ").setRequired(true).setControlType("AlpineCodeMirrorComponent").toOmniControl()
).addOutput(
  component.createOutput("any", "object", "any", { array: true }).set("title", "UI Connector").set("description", "Connect this socket to any input to create a UI element for it.").toOmniIO()
).addControl(component.createControl("button").set("title", "Generate Interface").setControlType("AlpineButtonComponent").setCustom("buttonAction", "script").setCustom("buttonValue", "save").set("description", "Regenerates the interface.").toOmniControl()).setMacro(OmniComponentMacroTypes.EXEC, async (payload, ctx, component2) => {
  const payloadValue = Object.assign({}, payload, ctx.args);
  const inputs = component2.enumerateInputs(ctx.node);
  await Promise.all(Object.keys(inputs).map(async (key) => {
    const input = inputs[key];
    if (input.customSocket) {
      if (["file", "image", "video", "audio", "document"].includes(input.customSocket)) {
        if (payloadValue[key] !== null) {
          const files = [];
          for (const file of payloadValue[key]) {
            if (file.storage === "b64-fixed-storage-provider") {
              const cdn_response = await ctx.app.cdn.putTemp(file.url, {
                mimeType: file.type,
                fileName: file.name,
                userId: ctx.userId,
                jobId: ctx.jobId
              });
              files.push(cdn_response);
            }
          }
          payloadValue[key] = files;
        }
      }
    }
  }));
  await ctx.app.emit("component:x-input", payloadValue);
  return { ...payloadValue };
});
component.setMacro(OmniComponentMacroTypes.ON_SAVE, async (node, recipe, ctx) => {
  recipe.ui ??= {};
  recipe.ui.formIO = {
    enabled: true
  };
  let output = node.outputs["any"];
  if (output.connections.length === 0) {
    return;
  }
  Object.keys(node.data).forEach((key) => !key.startsWith("x-omni-") && delete node.data[key]);
  let customInputs = {};
  let customOutputs = {};
  const components2 = {};
  const inputComponents = {};
  const outputComponents = {};
  components2["x-title"] = {
    "label": "Recipe Title",
    "tag": "h3",
    "attrs": [
      {
        "attr": "",
        "value": ""
      }
    ],
    "content": recipe.meta.name,
    "refreshOnChange": false,
    "key": "x-title",
    "type": "htmlelement",
    "input": false,
    "tableView": false
  };
  components2["x-desc"] = {
    "label": "Recipe Description",
    "tag": "p",
    "attrs": [
      {
        "attr": "",
        "value": ""
      }
    ],
    "content": recipe.meta.description,
    "refreshOnChange": false,
    "key": "x-desc",
    "type": "htmlelement",
    "input": false,
    "tableView": false
  };
  for (const conn in output.connections) {
    const connection = output.connections[conn];
    const targetNode = recipe.rete.nodes[connection.node];
    const targetBlock = await ctx.app.blocks.getInstance(targetNode.name);
    if (targetBlock) {
      let targetIO = targetBlock.inputs[connection.input];
      if (!targetIO) {
        if (targetNode.inputs[connection.input] && targetNode.data["x-omni-dynamicInputs"]?.[connection.input]) {
          targetIO = targetNode.data["x-omni-dynamicInputs"][connection.input];
        }
      }
      if (targetIO) {
        const { title, name, type, customSocket, socketOpts, description, minimum, maximum, step, choices } = targetIO;
        const defaultValue = targetIO.default;
        inputComponents[name] = {
          ...convertOmniIOToFormio({ ...targetIO, default: defaultValue })
        };
        let matchingConn = targetNode.inputs[connection.input]?.connections.find((e) => e.node === node.id && e.output === "any");
        if (matchingConn) {
          matchingConn.output = name;
        }
        node.outputs[name] = {};
        node.outputs[name].connections = [{ node: targetNode.id, input: name }];
        customOutputs[name] = customInputs[name] = {
          title,
          name,
          type,
          default: defaultValue,
          defaultValue,
          description,
          minimum,
          maximum,
          step,
          choices,
          customSocket,
          socketOpts,
          control: {
            type: "AlpineLabelControl"
          }
        };
        node.outputs[name];
      }
    }
  }
  output.connections = [];
  node.data["x-omni-dynamicInputs"] = customInputs;
  node.data["x-omni-dynamicOutputs"] = customOutputs;
  outputComponents["x-outputContent"] = {
    "label": "Results Pane",
    "tag": "div",
    "content": "Results will show up here!",
    "attrs": [
      {
        "attr": "id",
        "value": "outputContent"
      }
    ],
    "refreshOnChange": false,
    "key": "x-outputContent",
    "type": "htmlelement",
    "input": false,
    "tableView": false
  };
  const finalTree = {};
  finalTree.components = Object.values(components2);
  finalTree.components.push(
    {
      "input": false,
      "key": "tabs",
      "label": "Tabs",
      "tableView": false,
      "type": "tabs",
      components: [
        {
          components: Object.values(inputComponents),
          "key": "x-inputs",
          "label": "Inputs"
        }
      ]
    }
  );
  finalTree.components.push(
    {
      "label": "HTML",
      "tag": "div",
      "content": "&nbsp;",
      "attrs": [
        {
          "attr": "",
          "value": ""
        }
      ],
      "refreshOnChange": false,
      "key": "html",
      "type": "htmlelement",
      "input": false,
      "tableView": false
    },
    {
      "label": "Run Recipe",
      "showValidations": false,
      "disableOnInvalid": true,
      "tableView": true,
      "key": "submit",
      "type": "button",
      "input": true
    }
  );
  node.data.source = finalTree;
  return true;
});
var CustomUIComponent = component.toJSON();
var Formio_ui_default = CustomUIComponent;

// extension.ts
var components = [Formio_ui_default];
var extension_default = {
  createComponents: () => ({
    blocks: components,
    patches: []
  })
};
export {
  extension_default as default
};
