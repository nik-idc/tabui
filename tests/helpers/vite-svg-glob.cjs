const { readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");

// Jest uses Babel rather than Vite. Compile eager SVG globs from real files.
module.exports = ({ types }) => ({
  visitor: {
    CallExpression(nodePath, state) {
      const { callee, arguments: args } = nodePath.node;
      if (
        !types.isMemberExpression(callee) ||
        !types.isMetaProperty(callee.object) ||
        callee.object.meta.name !== "import" ||
        !types.isIdentifier(callee.property, { name: "glob" })
      ) {
        return;
      }

      const pattern = types.isStringLiteral(args[0])
        ? args[0].value.match(/^(.*\/)\{([^}]+)\}\/\*\*\/\*\.svg$/)
        : null;
      const options = types.isObjectExpression(args[1])
        ? Object.fromEntries(
            args[1].properties
              .filter((v) => types.isObjectProperty(v))
              .map((v) => [v.key.name ?? v.key.value, v.value.value])
          )
        : {};
      if (
        !pattern ||
        options.eager !== true ||
        options.query !== "?inline" ||
        options.import !== "default"
      ) {
        throw nodePath.buildCodeFrameError(
          "Jest's SVG glob adapter requires eager inline SVG imports"
        );
      }

      const [, prefix, folders] = pattern;
      const directory = path.resolve(path.dirname(state.filename), prefix);
      const roots = folders.split(",");
      const entries = readdirSync(directory, {
        recursive: true,
        withFileTypes: true,
      })
        .filter((v) => v.isFile() && v.name.endsWith(".svg"))
        .map((v) => path.join(v.parentPath ?? v.path, v.name))
        .map((v) => ({
          filename: v,
          relative: path.relative(directory, v).split(path.sep).join("/"),
        }))
        .filter((v) => roots.includes(v.relative.split("/")[0]))
        .map((v) =>
          types.objectProperty(
            types.stringLiteral(`${prefix}${v.relative}`),
            types.stringLiteral(
              `data:image/svg+xml,${encodeURIComponent(readFileSync(v.filename, "utf8"))}`
            )
          )
        );
      nodePath.replaceWith(types.objectExpression(entries));
    },
  },
});
