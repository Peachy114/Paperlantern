import { Fragment, useState, type ReactNode } from 'react'
import { EyeOff } from 'lucide-react'

// Comment markdown rendering ----
export function CommentMarkdown({ text, spoiler }: { text: string; spoiler: boolean }) {
    const [revealed, setRevealed] = useState(!spoiler)

    if (spoiler && !revealed) {
        return (
            <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                onClick={() => setRevealed(true)}
            >
                <EyeOff className="h-4 w-4" />
                Spoiler comment. Click to reveal.
            </button>
        )
    }

    return (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
            {text.split('\n').map((line, index) => (
                <Fragment key={`line-${index}`}>
                    {index > 0 ? '\n' : null}
                    {renderInlineMarkdown(line, `line-${index}`)}
                </Fragment>
            ))}
        </p>
    )
}

const INLINE_MARKDOWN_PATTERN =
    /(\|\|[^|]+\|\||\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|@[A-Za-z0-9_]+)/g

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = []
    let lastIndex = 0

    for (const match of text.matchAll(INLINE_MARKDOWN_PATTERN)) {
        const token = match[0]
        const index = match.index ?? 0
        if (index > lastIndex) nodes.push(text.slice(lastIndex, index))
        nodes.push(renderMarkdownToken(token, `${keyPrefix}-${index}`))
        lastIndex = index + token.length
    }

    if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

    return nodes
}

function renderMarkdownToken(token: string, key: string): ReactNode {
    if (token.startsWith('||') && token.endsWith('||')) {
        return <InlineSpoiler key={key} text={token.slice(2, -2)} />
    }

    if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={key}>{token.slice(2, -2)}</strong>
    }

    if (token.startsWith('*') && token.endsWith('*')) {
        return <em key={key}>{token.slice(1, -1)}</em>
    }

    if (token.startsWith('`') && token.endsWith('`')) {
        return (
            <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
                {token.slice(1, -1)}
            </code>
        )
    }

    if (token.startsWith('@')) {
        return (
            <span key={key} className="font-medium text-sky-600 dark:text-sky-400">
                {token}
            </span>
        )
    }

    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) {
        return (
            <a
                key={key}
                href={link[2]}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
            >
                {link[1]}
            </a>
        )
    }

    return token
}

function InlineSpoiler({ text }: { text: string }) {
    const [revealed, setRevealed] = useState(false)

    return (
        <button
            type="button"
            className="mx-0.5 rounded bg-foreground px-1.5 py-0.5 text-background"
            onClick={() => setRevealed(true)}
        >
            {revealed ? text : 'Spoiler'}
        </button>
    )
}

