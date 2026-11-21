/** Types JSON imports as unknown, so large scores don't slow type checks. */
declare module "*.json" {
  const value: unknown;
  export default value;
}
