import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface ChapterRichContentProps {
    content: string | null
    className?: string
    emptyClassName?: string
    variant?: 'public' | 'studio' | 'preview-pc' | 'preview-mobile'
}

export default function ChapterRichContent({
    content,
    className,
    emptyClassName,
    variant = 'public',
}: ChapterRichContentProps) {
    const html = useMemo(() => normalizeChapterHtml(content ?? ''), [content])

    // empty content section ----
    if (!htmlToText(html).trim()) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center py-24 text-sm text-muted-foreground italic',
                    emptyClassName
                )}
            >
                No content yet.
            </div>
        )
    }

    // rich chapter content section ----
    return (
        <article
            className={cn(
                'prose max-w-none break-words text-foreground dark:prose-invert',
                'prose-p:my-4 prose-p:leading-8 prose-hr:my-8 prose-blockquote:border-l-primary',
                'prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline',
                'font-[Georgia,serif]',
                variant === 'preview-mobile'
                    ? 'prose-sm text-[16px] leading-8'
                    : 'prose-base text-base sm:text-[17px] sm:leading-9',
                variant === 'studio' && 'font-[Noto_Serif,Georgia,serif]',
                className
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}

function normalizeChapterHtml(content: string): string {
    // legacy plain text support ----
    if (!/<[a-z][\s\S]*>/i.test(content)) {
        return escapeHtml(content).replace(/\r?\n/g, '<br>')
    }

    return sanitizeChapterHtml(content)
}

function sanitizeChapterHtml(html: string): string {
    // safe reader html sanitizer ----
    const allowedTags = new Set([
        'P',
        'BR',
        'STRONG',
        'B',
        'EM',
        'I',
        'U',
        'S',
        'STRIKE',
        'A',
        'OL',
        'UL',
        'LI',
        'BLOCKQUOTE',
        'HR',
        'H2',
        'H3',
        'DIV',
        'SPAN',
    ])
    const template = document.createElement('template')
    template.innerHTML = html

    const cleanNode = (node: Node) => {
        Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType !== Node.ELEMENT_NODE) return
            const element = child as HTMLElement

            if (!allowedTags.has(element.tagName)) {
                element.replaceWith(...Array.from(element.childNodes))
                return
            }

            Array.from(element.attributes).forEach((attribute) => {
                const name = attribute.name.toLowerCase()
                const value = attribute.value

                if (name.startsWith('on') || name === 'style') {
                    element.removeAttribute(attribute.name)
                    return
                }

                if (element.tagName === 'A') {
                    if (name === 'href' && !/^https?:\/\//i.test(value)) {
                        element.removeAttribute(attribute.name)
                    }
                    if (!['href', 'target', 'rel'].includes(name)) {
                        element.removeAttribute(attribute.name)
                    }
                    return
                }

                element.removeAttribute(attribute.name)
            })

            cleanNode(element)
        })
    }

    cleanNode(template.content)
    return template.innerHTML
}

function htmlToText(html: string): string {
    // reader text extraction ----
    const element = document.createElement('div')
    element.innerHTML = html
    return element.textContent ?? ''
}

function escapeHtml(value: string): string {
    // text escaping ----
    const element = document.createElement('div')
    element.textContent = value
    return element.innerHTML
}
