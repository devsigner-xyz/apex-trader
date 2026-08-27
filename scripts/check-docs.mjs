import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const required = [
  'AGENTS.md',
  'docs/README.md',
  'docs/product/professional-terminal.md',
  'docs/design-system/README.md',
  'docs/design-system/chart-patterns.md',
  'docs/design-system/panel-patterns.md',
  'docs/figma/README.md',
  'docs/decisions/README.md',
  'docs/decisions/0001-documentation-source-of-truth.md',
  'docs/decisions/0002-contextual-panel-headers.md',
  'docs/decisions/0003-visible-range-volume-profile.md',
  'docs/decisions/0004-fractional-chart-viewport.md',
  'docs/verification/2026-08-27-chart-interaction-and-density.md'
]

const errors = []

for (const relativePath of required) {
  const absolutePath = path.join(root, relativePath)
  try {
    await access(absolutePath)
  } catch {
    errors.push(`Missing required documentation: ${relativePath}`)
    continue
  }

  if (relativePath.startsWith('docs/')) {
    const content = await readFile(absolutePath, 'utf8')
    if (
      !content.startsWith('---\n') ||
      !content.includes('\nstatus: ') ||
      !content.includes('\nlast_verified: ')
    ) {
      errors.push(`Missing canonical metadata: ${relativePath}`)
    }
  }
}

const markdownLink = /\[[^\]]+\]\(([^)]+)\)/g

for (const relativePath of required.filter((file) => file.endsWith('.md'))) {
  let content
  try {
    content = await readFile(path.join(root, relativePath), 'utf8')
  } catch {
    continue
  }

  for (const match of content.matchAll(markdownLink)) {
    const target = match[1].split('#')[0]
    if (!target || /^(https?:|mailto:|#)/.test(target)) continue
    const resolved = path.resolve(root, path.dirname(relativePath), target)
    try {
      await access(resolved)
    } catch {
      errors.push(`Broken relative link in ${relativePath}: ${match[1]}`)
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Documentation contract OK (${required.length} required files)`)
