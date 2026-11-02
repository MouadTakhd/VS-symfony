// The contract between the router and a page controller (src/pages/<name>.ts).

export type Params = Record<string, string>

export interface PageContext {
  /** The page's own DOM: the contents of src/pages/<name>.html, already on screen. */
  root: HTMLElement
  /** Values from `$name` segments, e.g. patients.$id.html at #/patients/PR-1 → { id: 'PR-1' } */
  params: Params
  /** Go to another page: navigate('/patients') */
  navigate: (to: string) => void
  /** Aborted when the user leaves the page. Pass it to addEventListener / on() / fetch. */
  signal: AbortSignal
}

/** Optional function to run when the user leaves the page. */
export type Cleanup = () => void

export type Page = (ctx: PageContext) => void | Cleanup | Promise<void | Cleanup>

/** Wraps a controller so TypeScript checks it: export default definePage(async ({ root }) => { … }) */
export const definePage = (page: Page): Page => page
