import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips HTML tags and markdown formatting from text for display in previews
 * @param text - The text to clean
 * @returns Clean text without HTML tags and markdown formatting
 */
export function stripHtmlAndMarkdown(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/__(.*?)__/g, '$1') // Remove underline
    .replace(/^- /gm, '') // Remove list bullets
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}
