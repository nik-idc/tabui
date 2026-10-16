module.exports = {
  plugins: ["./tests/helpers/vite-svg-glob.cjs"],
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
