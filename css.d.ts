// Type declarations so TypeScript accepts the template's CSS imports
// (used by the web build only).
declare module "*.css";
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}
