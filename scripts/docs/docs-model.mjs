import { unified } from "unified"
import remarkParse from "remark-parse"
import GithubSlugger from "github-slugger"
import { resolve, relative, isAbsolute } from "node:path"

export function walk(node, visit) {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

export function parseMarkdown(source) {
  const tree = unified().use(remarkParse).parse(source)
  const anchors = new Set()
  const links = []
  const references = []
  const definitions = new Map()
  const codes = []
  const slugger = new GithubSlugger()
  const text = (node) => node.value ?? (node.children ?? []).map(text).join("")
  walk(tree, (node) => {
    if (node.type === "heading") anchors.add(slugger.slug(text(node)))
    if (node.type === "html") {
      // HTML ids only; links/Markdown syntax are parsed through mdast, not regex.
      for (const match of node.value.matchAll(/\bid=["']([^"']+)["']/g)) anchors.add(match[1])
    }
    if (["link", "image"].includes(node.type)) links.push(node.url)
    if (node.type === "definition") definitions.set(node.identifier, node.url)
    if (["linkReference", "imageReference"].includes(node.type)) references.push(node.identifier)
    if (node.type === "inlineCode") codes.push(node.value)
  })
  for (const reference of references) {
    if (!definitions.has(reference)) throw new Error(`Undefined Markdown reference: ${reference}`)
    links.push(definitions.get(reference))
  }
  return { anchors, links, codes }
}

export function localLinkTarget(root, directory, url) {
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//")) return null
  const [pathname, fragment = ""] = url.split("#")
  const path = resolve(directory, decodeURIComponent(pathname || "."))
  const escaped = relative(root, path)
  if (escaped.startsWith("..") || isAbsolute(escaped)) throw new Error("Link escapes repository")
  return { path, anchor: decodeURIComponent(fragment) }
}
