import { Filter } from 'bad-words'

const filter = new Filter()

export const containsBadWord = (text: string): boolean => {
    try {
        return filter.isProfane(text)
    } catch {
        return false
    }
}
