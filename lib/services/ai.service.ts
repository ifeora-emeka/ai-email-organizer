import { Category } from '@prisma/client';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

const openai = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 500,
});

export interface EmailContent
{
    subject?: string;
    fromEmail: string;
    fromName?: string;
    body?: string;
    htmlBody?: string;
}

export interface AICategorizationResult
{
    categoryId: string;
    categoryName: string;
    confidence: number;
    summary: string;
    priority: 'high' | 'medium' | 'low';
    unsubscribeLink?: string;
}

export class AIService
{
    static async categorizeAndSummarizeEmail(
        emailContent: EmailContent,
        categories: Category[]
    ): Promise<AICategorizationResult | undefined>
    {
        try {
            // Extract text content from email
            const textContent = this.extractTextContent(emailContent);

            // Create category descriptions for AI
            const categoryDescriptions = categories.map(cat =>
                `${cat.name}: ${cat.description}`
            ).join('\n');

            // Define the output schema
            const outputSchema = z.object({
                categoryName: z.string().describe("The exact category name from the provided list"),
                confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
                summary: z.string().describe("2-3 sentence summary of the email content"),
                priority: z.enum([ "high", "medium", "low" ]).describe("Priority level based on urgency and importance"),
                unsubscribeLink: z.string().nullable().describe("Unsubscribe URL if found in email, otherwise null")
            });

            const parser = StructuredOutputParser.fromZodSchema(outputSchema);

            const prompt = PromptTemplate.fromTemplate(`
You are an AI email assistant. Analyze the following email and categorize it into one of the provided categories, then provide a concise summary.

Available categories:
{categoryDescriptions}

Email content:
Subject: {subject}
From: {fromName} ({fromEmail})
Content: {content}

{format_instructions}

Consider:
- Category descriptions when making decisions
- Email content, sender, and context
- Priority based on urgency and importance
- Look for unsubscribe links in the content
`);

            const formattedPrompt = await prompt.format({
                categoryDescriptions,
                subject: emailContent.subject || 'No subject',
                fromName: emailContent.fromName || emailContent.fromEmail,
                fromEmail: emailContent.fromEmail,
                content: emailContent,
                format_instructions: parser.getFormatInstructions()
            });

            const response = await openai.invoke(formattedPrompt);
            const aiResult = await parser.parse(response.content as string);

            // Find the category ID based on the AI's category name
            const matchedCategory = categories.find(cat =>
                cat.name.toLowerCase() === aiResult.categoryName.toLowerCase()
            );

            if (!matchedCategory) {
                throw new Error(`Category "${aiResult.categoryName}" not found`);
            }

            return {
                categoryId: matchedCategory.id,
                categoryName: matchedCategory.name,
                confidence: Math.min(1, Math.max(0, aiResult.confidence)),
                summary: aiResult.summary,
                priority: aiResult.priority || 'medium',
                unsubscribeLink: aiResult.unsubscribeLink || undefined
            };

        } catch (error) {
            console.error('AI categorization error:', error);

            // Fallback to default category if AI fails
            const defaultCategory = categories[ 0 ];
            return {
                categoryId: defaultCategory?.id || '',
                categoryName: defaultCategory?.name || 'Uncategorized',
                confidence: 0.5,
                summary: `Email from ${emailContent.fromEmail}${emailContent.subject ? ` regarding "${emailContent.subject}"` : ''}. Content processing failed.`,
                priority: 'medium',
                unsubscribeLink: undefined
            };
        }
    }

    private static extractTextContent(emailContent: EmailContent): string
    {
        let content = '';

        if (emailContent.body) {
            content += emailContent.body;
        }

        if (emailContent.htmlBody) {
            // Enhanced HTML to text conversion
            let htmlContent = emailContent.htmlBody;

            // Extract href attributes from links (important for unsubscribe links)
            const linkMatches = htmlContent.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi);
            if (linkMatches) {
                linkMatches.forEach(match =>
                {
                    const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
                    const textMatch = match.match(/>([^<]+)</i);
                    if (hrefMatch && textMatch) {
                        content += ` [LINK: ${textMatch[ 1 ].trim()} -> ${hrefMatch[ 1 ]}] `;
                    }
                });
            }

            // Remove HTML tags but preserve link information
            const textContent = htmlContent
                .replace(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, '$2 ($1)') // Convert links to text with URL
                .replace(/<[^>]*>/g, ' ') // Remove remaining HTML tags
                .replace(/&nbsp;/g, ' ') // Replace HTML entities
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

            content += ' ' + textContent;
        }

        return content.substring(0, 6000); // Increased limit for better link detection
    }

    static async extractUnsubscribeLink(emailContent: EmailContent): Promise<string | undefined>
    {
        try {
            // First try regex-based extraction for common patterns
            const regexLink = this.extractUnsubscribeLinkWithRegex(emailContent);
            if (regexLink) {
                console.log('🔗 Found unsubscribe link via regex:', regexLink);
                return regexLink;
            }

            // If regex fails, use AI as fallback
            const textContent = this.extractTextContent(emailContent);

            // Define the output schema for unsubscribe link extraction
            const unsubscribeSchema = z.object({
                unsubscribeLink: z.string().url().nullable().describe("The unsubscribe URL if found, otherwise null"),
                confidence: z.number().min(0).max(1).describe("Confidence in the extracted link (0-1)"),
                reasoning: z.string().describe("Brief explanation of why this link was selected")
            });

            const parser = StructuredOutputParser.fromZodSchema(unsubscribeSchema);

            const prompt = PromptTemplate.fromTemplate(`
You are an expert at finding unsubscribe links in emails. Extract any unsubscribe link from the following email content.

Look for these patterns and variations:
- Direct unsubscribe links: "unsubscribe", "opt-out", "opt out", "unsub"
- Preference management: "manage preferences", "email preferences", "subscription settings"
- One-click unsubscribe: "click here to unsubscribe", "unsubscribe here"
- List removal: "remove from list", "remove me", "stop receiving"
- Marketing preferences: "marketing preferences", "communication preferences"
- Hidden links: Links in footer, small text, or image alt text
- Multiple formats: HTTP, HTTPS, relative URLs, query parameters

Email content:
{content}

{format_instructions}

IMPORTANT:
- Return the FULL URL including protocol (http:// or https://)
- If the URL is relative, make it absolute based on the email domain
- Look in both text and HTML content
- Check footer sections and small print
- Consider variations in wording and formatting
- Return null only if absolutely no unsubscribe link is found
`);

            const formattedPrompt = await prompt.format({
                content: textContent,
                format_instructions: parser.getFormatInstructions()
            });

            const response = await openai.invoke(formattedPrompt);
            const result = await parser.parse(response.content as string);

            if (result.unsubscribeLink && result.confidence > 0.3) {
                console.log('🤖 AI found unsubscribe link:', result.unsubscribeLink, 'Confidence:', result.confidence);
                return result.unsubscribeLink;
            }

            return undefined;
        } catch (error) {
            console.error('Error extracting unsubscribe link:', error);
            return undefined;
        }
    }

    private static extractUnsubscribeLinkWithRegex(emailContent: EmailContent): string | undefined
    {
        const content = emailContent.htmlBody || emailContent.body || '';

        // Common unsubscribe link patterns
        const patterns = [
            // Direct unsubscribe patterns
            /(?:unsubscribe|opt[-\s]?out|unsub)\s*(?:here|now|link)?\s*[:\s]*\s*(https?:\/\/[^\s<>"']+)/gi,
            /(?:click\s+here\s+to\s+)?(?:unsubscribe|opt[-\s]?out)\s*[:\s]*\s*(https?:\/\/[^\s<>"']+)/gi,

            // Preference management patterns
            /(?:manage\s+preferences?|email\s+preferences?|subscription\s+settings?)\s*[:\s]*\s*(https?:\/\/[^\s<>"']+)/gi,

            // List removal patterns
            /(?:remove\s+(?:from\s+)?list|remove\s+me|stop\s+receiving)\s*[:\s]*\s*(https?:\/\/[^\s<>"']+)/gi,

            // Marketing preferences
            /(?:marketing\s+preferences?|communication\s+preferences?)\s*[:\s]*\s*(https?:\/\/[^\s<>"']+)/gi,

            // Generic unsubscribe in href attributes
            /href\s*=\s*["']([^"']*(?:unsubscribe|opt[-\s]?out|unsub|preferences?)[^"']*)["']/gi,

            // Footer unsubscribe links
            /(?:footer|bottom)\s*[:\s]*\s*(https?:\/\/[^\s<>"']*(?:unsubscribe|opt[-\s]?out|unsub)[^\s<>"']*)/gi,
        ];

        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
                // Extract the URL from the match
                let url = matches[ 1 ] || matches[ 0 ];

                // Clean up the URL
                url = url.replace(/["'<>]/g, '').trim();

                // Validate it's a proper URL
                if (this.isValidUrl(url)) {
                    return url;
                }
            }
        }

        return undefined;
    }

    private static isValidUrl(url: string): boolean
    {
        try {
            new URL(url);
            return true;
        } catch {
            // Try to make it absolute if it's relative
            if (url.startsWith('/') || url.startsWith('./')) {
                return true; // Relative URLs are valid
            }
            return false;
        }
    }

    // Test method for unsubscribe link extraction
    static async testUnsubscribeExtraction(emailContent: EmailContent): Promise<{
        regexResult: string | undefined;
        aiResult: string | undefined;
        finalResult: string | undefined;
        contentLength: number;
    }>
    {
        const regexResult = this.extractUnsubscribeLinkWithRegex(emailContent);
        const textContent = this.extractTextContent(emailContent);

        let aiResult: string | undefined;
        try {
            const unsubscribeSchema = z.object({
                unsubscribeLink: z.string().url().nullable(),
                confidence: z.number().min(0).max(1),
                reasoning: z.string()
            });
            const parser = StructuredOutputParser.fromZodSchema(unsubscribeSchema);

            const prompt = PromptTemplate.fromTemplate(`
Extract unsubscribe link from email content. Look for: unsubscribe, opt-out, preferences, etc.

Content: {content}

{format_instructions}
`);

            const formattedPrompt = await prompt.format({
                content: textContent,
                format_instructions: parser.getFormatInstructions()
            });

            const response = await openai.invoke(formattedPrompt);
            const result = await parser.parse(response.content as string);
            aiResult = result.unsubscribeLink || undefined;
        } catch (error) {
            console.error('AI extraction test failed:', error);
        }

        const finalResult = regexResult || aiResult;

        return {
            regexResult,
            aiResult,
            finalResult,
            contentLength: textContent.length
        };
    }
}
