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
                content: textContent,
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
            // Basic HTML to text conversion
            const textContent = emailContent.htmlBody
                .replace(/<[^>]*>/g, ' ') // Remove HTML tags
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            content += ' ' + textContent;
        }

        return content.substring(0, 4000); // Limit content length for AI processing
    }

    static async extractUnsubscribeLink(emailContent: EmailContent): Promise<string | undefined>
    {
        try {
            const textContent = this.extractTextContent(emailContent);

            // Define the output schema for unsubscribe link extraction
            const unsubscribeSchema = z.object({
                unsubscribeLink: z.string().url().nullable().describe("The unsubscribe URL if found, otherwise null")
            });

            const parser = StructuredOutputParser.fromZodSchema(unsubscribeSchema);

            const prompt = PromptTemplate.fromTemplate(`
Extract any unsubscribe link from the following email content. Look for patterns like:
- "unsubscribe" followed by a URL
- "opt-out" followed by a URL
- "click here to unsubscribe" with a link
- "manage preferences" with a link

Email content:
{content}

{format_instructions}

Respond with only the unsubscribe URL if found, or null if no unsubscribe link is found.
`);

            const formattedPrompt = await prompt.format({
                content: textContent,
                format_instructions: parser.getFormatInstructions()
            });

            const response = await openai.invoke(formattedPrompt);
            const result = await parser.parse(response.content as string);

            return result.unsubscribeLink || undefined;
        } catch (error) {
            console.error('Error extracting unsubscribe link:', error);
            return undefined;
        }
    }
}
