import puppeteer, { Browser, Page } from 'puppeteer';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { prisma } from '../prisma';
import chromium from '@sparticuz/chromium-min';

export interface UnsubscribeResult
{
    success: boolean;
    message: string;
    requiresFormFilling?: boolean;
    formData?: Record<string, string>;
    error?: string;
    screenshotPath?: string; // For debugging
    finalUrl?: string;
}

export interface UnsubscribeFormData
{
    email?: string;
    reason?: string;
    confirm?: boolean;
    [ key: string ]: any;
}

const remoteExecutablePath = "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar";

export class UnsubscribeAgentService
{
    private static browser: Browser | null = null;
    private static readonly openai = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
        maxRetries: 3,
    });

    static async initializeBrowser(): Promise<Browser>
    {
        const baseArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--window-size=1920,1080',
            // Memory management
            '--max-old-space-size=2048',
            '--memory-pressure-off',
            // Stability improvements
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images', // Reduce memory usage
            '--disable-javascript-harmony-shipping',
            '--disable-background-networking',
        ];

        if (!this.browser) {
            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                try {
                    const executablePath = await chromium.executablePath(remoteExecutablePath);
                    console.log('Production: Using @sparticuz/chromium-min');
                    console.log('Chromium executable path:', executablePath);

                    this.browser = await puppeteer.launch({
                        headless: true,
                        executablePath,
                        args: [
                            ...chromium.args,
                            ...baseArgs,
                        ],
                        ignoreDefaultArgs: [ '--disable-extensions' ],
                        defaultViewport: { width: 1920, height: 1080 },
                        timeout: 30000, // 30 second timeout
                    });

                    console.log('✅ Production browser initialized successfully');
                } catch (error) {
                    console.error('❌ Failed to initialize production browser:', error);

                    // Enhanced fallback with more conservative settings
                    this.browser = await puppeteer.launch({
                        headless: true,
                        args: [
                            ...baseArgs,
                        ],
                        defaultViewport: { width: 1920, height: 1080 },
                        timeout: 30000,
                    });
                    console.log('✅ Production fallback browser initialized');
                }
            } else {
                console.log('Development: Using normal Puppeteer');
                this.browser = await puppeteer.launch({
                    headless: false,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                    ],
                    defaultViewport: { width: 1920, height: 1080 },
                    slowMo: 100, // Slow down for debugging
                    timeout: 30000,
                });
                console.log('✅ Development browser initialized');
            }

            // Add browser error handling
            this.browser.on('disconnected', () =>
            {
                console.warn('⚠️ Browser disconnected unexpectedly');
                this.browser = null;
            });

            this.browser.on('error', (error) =>
            {
                console.error('❌ Browser error:', error);
                this.browser = null;
            });
        }
        return this.browser;
    }

    static async closeBrowser(): Promise<void>
    {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    static async unsubscribeFromEmail(
        emailId: string,
        unsubscribeLink: string,
        userEmail?: string
    ): Promise<UnsubscribeResult>
    {
        const browser = await this.initializeBrowser();
        let page: Page | null = null;

        try {
            // Create page with error handling
            page = await browser.newPage();

            // Enhanced page setup
            await this.setupPage(page);

            console.log(`🔗 Navigating to: ${unsubscribeLink}`);

            const email = await prisma.email.findUnique({
                where: {
                    id: emailId,
                },
                include: {
                    gmailAccount: {
                        select: {
                            email: true,
                        },
                    },
                },
            });

            // Navigate with better error handling
            const navigationResult = await this.navigateToPage(page, unsubscribeLink);
            if (!navigationResult.success) {
                return {
                    success: false,
                    message: 'Failed to navigate to unsubscribe page',
                    error: navigationResult.error,
                };
            }

            // Take screenshot for debugging
            const screenshotPath = await this.takeScreenshot(page, emailId, 'initial');

            // Wait for content to stabilize
            console.log('Waiting for content to stabilize...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Analyze page content
            const pageContent = await this.analyzePageContent(page);

            // Use AI to determine strategy
            const strategy = await this.determineUnsubscribeStrategy(pageContent, email?.gmailAccount?.email || userEmail);
            console.log('🤖 AI Strategy:', strategy);

            let result: UnsubscribeResult;

            if (strategy.requiresFormFilling && strategy.formData) {
                result = await this.handleFormBasedUnsubscribe(page, strategy.formData, emailId);
            } else {
                result = await this.handleDirectUnsubscribe(page, strategy, emailId);
            }

            // Add final screenshot and URL
            result.screenshotPath = await this.takeScreenshot(page, emailId, 'final');
            result.finalUrl = page.url();

            // Update database
            await this.updateUnsubscribeTask(emailId, result);
            return result;

        } catch (error) {
            console.error('❌ Unsubscribe error:', error);

            let screenshotPath: string | undefined;
            let finalUrl: string | undefined;

            // Safely get screenshot and URL if page is still available
            if (page && !page.isClosed()) {
                try {
                    screenshotPath = await this.takeScreenshot(page, emailId, 'error');
                    finalUrl = page.url();
                } catch (screenshotError) {
                    console.warn('⚠️ Failed to take error screenshot:', screenshotError);
                }
            }

            const result: UnsubscribeResult = {
                success: false,
                message: 'Failed to unsubscribe due to unexpected error',
                error: error instanceof Error ? error.message : 'Unknown error',
                screenshotPath,
                finalUrl,
            };

            await this.updateUnsubscribeTask(emailId, result);
            return result;
        } finally {
            // Safely close page
            if (page && !page.isClosed()) {
                try {
                    await page.close();
                } catch (closeError) {
                    console.warn('⚠️ Failed to close page:', closeError);
                }
            }
        }
    }

    private static async setupPage(page: Page): Promise<void>
    {
        // Set realistic user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Set additional headers to appear more human-like
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
        });

        // Block unnecessary resources to speed up loading
        await page.setRequestInterception(true);
        page.on('request', (req) =>
        {
            const resourceType = req.resourceType();
            if ([ 'image', 'stylesheet', 'font', 'media' ].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    private static async navigateToPage(page: Page, url: string): Promise<{ success: boolean; error?: string; }>
    {
        try {
            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded', // Faster than networkidle2
                timeout: 30000
            });

            if (!response || !response.ok()) {
                return {
                    success: false,
                    error: `HTTP ${response?.status()}: ${response?.statusText()}`,
                };
            }

            // Wait for page to be interactive
            await page.waitForFunction(() => document.readyState === 'interactive' || document.readyState === 'complete');

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Navigation failed',
            };
        }
    }

    private static async takeScreenshot(page: Page, emailId: string, stage: string): Promise<string | undefined>
    {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `unsubscribe-${emailId}-${stage}-${timestamp}.png`;
            const path = `./screenshots/${filename}`;

            // Take screenshot as buffer first, then save to file
            const screenshotBuffer = await page.screenshot({
                fullPage: true,
                type: 'png'
            });

            // Note: In a real implementation, you'd save the buffer to file
            // For now, we'll just return the filename
            console.log(`📸 Screenshot taken: ${filename}`);
            return filename;
        } catch (error) {
            console.warn('📸 Screenshot failed:', error);
            return undefined;
        }
    }

    private static async analyzePageContent(page: Page): Promise<string>
    {
        const content = await page.evaluate(() =>
        {
            // Enhanced content extraction
            const getElementInfo = (element: Element) => ({
                tag: element.tagName.toLowerCase(),
                text: element.textContent?.trim().substring(0, 200), // Limit text length
                type: element.getAttribute('type'),
                name: element.getAttribute('name'),
                id: element.id,
                className: element.className,
                placeholder: element.getAttribute('placeholder'),
                href: element.getAttribute('href'),
                onclick: element.getAttribute('onclick'),
                value: (element as HTMLInputElement).value,
                required: (element as HTMLInputElement).required,
            });

            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 2000), // Limit text
                forms: Array.from(document.forms).map(form => ({
                    action: form.action,
                    method: form.method,
                    elements: Array.from(form.elements).slice(0, 10).map(getElementInfo), // Limit elements
                })),
                buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
                    .slice(0, 20)
                    .map(getElementInfo),
                links: Array.from(document.querySelectorAll('a'))
                    .filter(a =>
                    {
                        const text = a.textContent?.toLowerCase() || '';
                        return text.includes('unsubscribe') ||
                            text.includes('opt-out') ||
                            text.includes('remove') ||
                            text.includes('preferences');
                    })
                    .slice(0, 10)
                    .map(getElementInfo),
                checkboxes: Array.from(document.querySelectorAll('input[type="checkbox"]'))
                    .slice(0, 5)
                    .map(getElementInfo),
                selects: Array.from(document.querySelectorAll('select'))
                    .slice(0, 5)
                    .map(getElementInfo),
            };
        });

        return JSON.stringify(content, null, 2);
    }

    private static async analyzeFormFields(page: Page, userEmail: string): Promise<{
        fieldActions: Array<{
            fieldName: string;
            fieldType: string;
            action: 'fill' | 'select' | 'check' | 'uncheck' | 'click';
            value?: string;
            selector: string;
        }>;
        submitAction: {
            selector: string;
            action: 'click' | 'submit';
        };
        recommendations: string[];
    }>
    {
        // Get complete HTML structure of the page
        const pageHTML = await page.evaluate(() =>
        {
            return {
                forms: Array.from(document.forms).map(form => ({
                    action: form.action,
                    method: form.method,
                    id: form.id,
                    className: form.className,
                    elements: Array.from(form.elements).map(el =>
                    {
                        const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                        return {
                            name: element.name,
                            id: element.id,
                            type: element.type,
                            tagName: element.tagName.toLowerCase(),
                            placeholder: 'placeholder' in element ? element.placeholder : undefined,
                            required: element.required,
                            value: element.value,
                            className: element.className,
                            checked: (element.type === 'checkbox' || element.type === 'radio') ? (element as HTMLInputElement).checked : undefined,
                            options: element.tagName.toLowerCase() === 'select' ?
                                Array.from((element as HTMLSelectElement).options).map(opt => ({
                                    value: opt.value,
                                    text: opt.textContent,
                                    selected: opt.selected
                                })) : undefined,
                            // Get unique selector for this element
                            selector: element.id ? `#${element.id}` :
                                element.name ? `[name="${element.name}"]` :
                                    element.className ? `.${element.className.split(' ').join('.')}` :
                                        `${element.tagName.toLowerCase()}[type="${element.type}"]`
                        };
                    })
                })),
                buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(btn =>
                {
                    const button = btn as HTMLButtonElement | HTMLInputElement;
                    return {
                        text: button.textContent || button.value,
                        type: button.type,
                        name: button.name,
                        id: button.id,
                        className: button.className,
                        selector: button.id ? `#${button.id}` :
                            button.name ? `[name="${button.name}"]` :
                                button.className ? `.${button.className.split(' ').join('.')}` :
                                    `${button.tagName.toLowerCase()}[type="${button.type}"]`
                    };
                }),
                pageTitle: document.title,
                pageUrl: window.location.href
            };
        });

        // Use AI to analyze the complete HTML structure and determine actions
        const aiAnalysis = await this.getAIActionPlan(pageHTML, userEmail);

        return {
            fieldActions: aiAnalysis.fieldActions,
            submitAction: aiAnalysis.submitAction,
            recommendations: aiAnalysis.recommendations
        };
    }

    private static async getAIActionPlan(pageHTML: any, userEmail: string): Promise<{
        fieldActions: Array<{
            fieldName: string;
            fieldType: string;
            action: 'fill' | 'select' | 'check' | 'uncheck' | 'click';
            value?: string;
            selector: string;
        }>;
        submitAction: {
            selector: string;
            action: 'click' | 'submit';
        };
        recommendations: string[];
    }>
    {
        const parser = StructuredOutputParser.fromZodSchema(
            z.object({
                fieldActions: z.array(z.object({
                    fieldName: z.string().describe('Name or identifier of the field'),
                    fieldType: z.string().describe('Type of field (text, email, checkbox, radio, select, etc.)'),
                    action: z.enum([ 'fill', 'select', 'check', 'uncheck', 'click' ]).describe('Action to perform on this field'),
                    value: z.string().optional().describe('Value to fill or select (for fill/select actions)'),
                    selector: z.string().describe('CSS selector to target this field')
                })).describe('List of actions to perform on form fields'),
                submitAction: z.object({
                    selector: z.string().describe('CSS selector for the submit button'),
                    action: z.enum([ 'click', 'submit' ]).describe('How to submit the form')
                }).describe('Action to submit the form'),
                recommendations: z.array(z.string()).describe('List of recommendations for the unsubscribe process')
            })
        );

        const prompt = PromptTemplate.fromTemplate(`
You are an expert at analyzing unsubscribe forms and determining the exact actions needed to complete the unsubscribe process.

Page HTML Structure:
{pageHTML}

User Email: {userEmail}

Your task is to analyze the HTML structure and determine:
1. What fields need to be filled and with what values
2. What checkboxes/radio buttons need to be checked/unchecked
3. What dropdown options need to be selected
4. What submit button to click

IMPORTANT RULES:
- For email fields: use the user's email
- For name fields: use "John Doe"
- For phone fields: use "+1234567890"
- For address fields: use "123 Main St, New York, NY 10001"
- For company fields: use "Individual"
- For reason fields: use "No longer interested" or "Too many emails"
- For preference fields: choose "Never" or "None" options
- For confirmation checkboxes: CHECK them
- For radio buttons: select the most appropriate option for unsubscribing
- For dropdowns: select options that indicate unsubscribing or "No longer interested"

For each field, provide:
- fieldName: the name or identifier
- fieldType: the HTML input type
- action: what to do (fill, select, check, uncheck, click)
- value: what value to use (for fill/select actions)
- selector: the exact CSS selector to target this element

For the submit action, find the button that will complete the unsubscribe process.
don't return hidden fields or spam detection fields.

CRITICAL: Return only valid JSON without markdown formatting.

{format_instructions}
`);

        try {
            const formattedPrompt = await prompt.format({
                pageHTML: JSON.stringify(pageHTML, null, 2),
                userEmail,
                format_instructions: parser.getFormatInstructions(),
            });

            const response = await this.openai.invoke(formattedPrompt);
            const cleanedResponse = this.cleanAIResponse(response.content as string);
            const result = await parser.parse(cleanedResponse);

            return {
                fieldActions: result.fieldActions,
                submitAction: result.submitAction,
                recommendations: result.recommendations
            };
        } catch (error) {
            console.error('❌ AI action plan failed:', error);
            return {
                fieldActions: [],
                submitAction: { selector: 'input[type="submit"], button[type="submit"]', action: 'click' },
                recommendations: [ 'Use fallback form submission' ]
            };
        }
    }

    private static async determineUnsubscribeStrategy(
        pageContent: string,
        userEmail?: string
    ): Promise<{
        requiresFormFilling: boolean;
        formData?: UnsubscribeFormData;
        actionType: 'click' | 'form' | 'link' | 'multi-step';
        targetSelector?: string;
        fallbackSelectors?: string[];
        explanation?: string;
    }>
    {
        const parser = StructuredOutputParser.fromZodSchema(
            z.object({
                requiresFormFilling: z.boolean().describe('Whether the page requires form filling'),
                actionType: z.enum([ 'click', 'form', 'link', 'multi-step' ]).describe('Type of action needed'),
                targetSelector: z.string().optional().describe('Primary CSS selector for unsubscribe element'),
                fallbackSelectors: z.array(z.string()).optional().describe('Alternative selectors to try'),
                formData: z.object({
                    email: z.string().optional(),
                    reason: z.string().optional(),
                    confirm: z.boolean().optional(),
                }).optional(),
                confidence: z.number().min(0).max(1).describe('Confidence in strategy (0-1)'),
                explanation: z.string().describe('Detailed explanation of the chosen strategy'),
            })
        );

        const prompt = PromptTemplate.fromTemplate(`
You are an expert at analyzing unsubscribe pages and determining the optimal strategy.

Page Content Analysis:
{pageContent}

User Email: {userEmail}

Instructions:
1. Analyze the page structure carefully
2. Look for direct unsubscribe buttons/links (preferred)
3. Identify any required form fields
4. Consider multi-step processes
5. Provide fallback selectors in case primary fails
6. Rate your confidence in the strategy

Common patterns to look for:
- "Unsubscribe" or "Opt out" buttons
- Email confirmation fields
- Reason dropdowns/selections
- Confirmation checkboxes
- "Update preferences" vs "Remove completely"

CRITICAL: Return only valid JSON without markdown formatting.

{format_instructions}
`);


        const formattedPrompt = await prompt.format({
            pageContent: pageContent.substring(0, 4000), // Limit content size
            userEmail: userEmail || 'Not provided',
            format_instructions: parser.getFormatInstructions(),
        });

        try {
            const response = await this.openai.invoke(formattedPrompt);
            let cleanedResponse = this.cleanAIResponse(response.content as string);

            console.log('🤖 AI Analysis:', cleanedResponse.substring(0, 500));

            const result = await parser.parse(cleanedResponse);

            return {
                requiresFormFilling: result.requiresFormFilling,
                formData: result.formData,
                actionType: result.actionType,
                targetSelector: result.targetSelector,
                fallbackSelectors: result.fallbackSelectors,
                explanation: result.explanation,
            };
        } catch (error) {
            console.error('❌ AI strategy parsing failed:', error);

            // Enhanced fallback strategy
            return this.createFallbackStrategy(pageContent);
        }
    }

    private static createFallbackStrategy(pageContent: string): any
    {
        // Simple text-based fallback
        const content = pageContent.toLowerCase();

        if (content.includes('form') && content.includes('email')) {
            return {
                requiresFormFilling: true,
                actionType: 'form' as const,
                targetSelector: 'form',
                fallbackSelectors: [ 'input[type="submit"]', 'button[type="submit"]' ],
                explanation: 'Fallback: Detected form with email field',
            };
        }

        return {
            requiresFormFilling: false,
            actionType: 'click' as const,
            targetSelector: 'a[href*="unsubscribe"], button:contains("unsubscribe")',
            fallbackSelectors: [
                'a[href*="opt-out"]',
                'button:contains("opt out")',
                'a:contains("unsubscribe")',
                'button:contains("remove")',
            ],
            explanation: 'Fallback: Generic unsubscribe element detection',
        };
    }

    private static async handleDirectUnsubscribe(
        page: Page,
        strategy: any,
        emailId: string
    ): Promise<UnsubscribeResult>
    {
        try {
            const selectorsToTry = [
                strategy.targetSelector,
                ...(strategy.fallbackSelectors || []),
            ].filter(Boolean);

            let clicked = false;
            let lastError: string | undefined;

            for (const selector of selectorsToTry) {
                try {
                    console.log(`🎯 Trying selector: ${selector}`);

                    // Wait for element with shorter timeout
                    await page.waitForSelector(selector, { timeout: 5000 });

                    // Scroll element into view
                    await page.evaluate((sel) =>
                    {
                        const element = document.querySelector(sel);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, selector);

                    // Small delay for scroll animation
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Click the element
                    await page.click(selector);
                    clicked = true;
                    console.log(`✅ Successfully clicked: ${selector}`);
                    break;

                } catch (error) {
                    lastError = error instanceof Error ? error.message : 'Click failed';
                    console.log(`❌ Failed selector ${selector}: ${lastError}`);
                    continue;
                }
            }

            if (!clicked) {
                return {
                    success: false,
                    message: 'No clickable unsubscribe elements found',
                    error: lastError,
                };
            }

            // Wait for page response
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check for success
            const success = await this.checkUnsubscribeSuccess(page);

            return {
                success,
                message: success ? 'Successfully unsubscribed via direct click' : 'Click completed but success unclear',
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to perform direct unsubscribe',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private static async handleFormBasedUnsubscribe(
        page: Page,
        formData: UnsubscribeFormData,
        emailId: string
    ): Promise<UnsubscribeResult>
    {
        try {
            console.log('📝 Handling form-based unsubscribe...');

            // Get the user's email from database
            const email = await prisma.email.findUnique({
                where: {
                    id: emailId,
                },
                include: {
                    gmailAccount: {
                        select: {
                            email: true,
                        },
                    },
                },
            });

            const userEmail = email?.gmailAccount?.email || formData.email;
            console.log('📧 Using email:', userEmail);

            // Use AI to analyze form fields and determine what to fill
            const formAnalysis = await this.analyzeFormFields(page, userEmail || '');
            console.log('🤖 AI Form Analysis:', formAnalysis);

            // Enhanced form field filling with AI guidance
            const fieldMappings = [
                {
                    data: userEmail,
                    selectors: [
                        'input[type="email"]',
                        'input[name*="email" i]',
                        'input[placeholder*="email" i]',
                        'input[id*="email" i]',
                        'input[name*="e-mail" i]',
                        'input[placeholder*="e-mail" i]',
                    ],
                    name: 'email',
                    required: true,
                },
                {
                    data: formData.reason || 'No longer interested',
                    selectors: [
                        'select[name*="reason" i]',
                        'input[name*="reason" i]',
                        'textarea[name*="reason" i]',
                        'select[id*="reason" i]',
                        'select[name*="why" i]',
                        'input[name*="why" i]',
                    ],
                    name: 'reason',
                    required: false,
                },
                {
                    data: formData.confirm ? 'true' : 'false',
                    selectors: [
                        'input[type="checkbox"][name*="confirm" i]',
                        'input[type="checkbox"][id*="confirm" i]',
                        'input[type="checkbox"][name*="agree" i]',
                        'input[type="checkbox"][name*="accept" i]',
                    ],
                    name: 'confirmation',
                    required: false,
                    type: 'checkbox',
                },
            ];

            // Execute AI-determined actions
            console.log('🤖 Executing AI-determined form actions...');

            for (const fieldAction of formAnalysis.fieldActions) {
                try {
                    console.log(`🎯 Executing action: ${fieldAction.action} on ${fieldAction.fieldName} (${fieldAction.fieldType})`);

                    switch (fieldAction.action) {
                        case 'fill':
                            await page.waitForSelector(fieldAction.selector, { timeout: 3000 });
                            await page.focus(fieldAction.selector);
                            await page.keyboard.down('Control');
                            await page.keyboard.press('a');
                            await page.keyboard.up('Control');
                            await page.type(fieldAction.selector, fieldAction.value || '', { delay: 50 });
                            console.log(`✅ Filled ${fieldAction.fieldName} with: ${fieldAction.value}`);
                            break;

                        case 'select':
                            await page.waitForSelector(fieldAction.selector, { timeout: 3000 });
                            await page.select(fieldAction.selector, fieldAction.value || '');
                            console.log(`✅ Selected ${fieldAction.value} in ${fieldAction.fieldName}`);
                            break;

                        case 'check':
                            await page.waitForSelector(fieldAction.selector, { timeout: 3000 });
                            const isChecked = await page.$eval(fieldAction.selector, el => (el as HTMLInputElement).checked);
                            if (!isChecked) {
                                await page.click(fieldAction.selector);
                                console.log(`✅ Checked ${fieldAction.fieldName}`);
                            }
                            break;

                        case 'uncheck':
                            await page.waitForSelector(fieldAction.selector, { timeout: 3000 });
                            const isChecked2 = await page.$eval(fieldAction.selector, el => (el as HTMLInputElement).checked);
                            if (isChecked2) {
                                await page.click(fieldAction.selector);
                                console.log(`✅ Unchecked ${fieldAction.fieldName}`);
                            }
                            break;

                        case 'click':
                            await page.waitForSelector(fieldAction.selector, { timeout: 3000 });
                            await page.click(fieldAction.selector);
                            console.log(`✅ Clicked ${fieldAction.fieldName}`);
                            break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to execute action on ${fieldAction.fieldName}:`, error);
                }
            }

            // Handle checkboxes and confirmations
            await this.handleCheckboxes(page, formData.confirm || false);

            // Handle confirmation checkbox
            if (formData.confirm) {
                const checkboxSelectors = [
                    'input[type="checkbox"][name*="confirm" i]',
                    'input[type="checkbox"][id*="confirm" i]',
                    'input[type="checkbox"]', // Fallback to any checkbox
                ];

                for (const selector of checkboxSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 3000 });
                        const isChecked = await page.$eval(selector, el => (el as HTMLInputElement).checked);
                        if (!isChecked) {
                            await page.click(selector);
                            console.log('✅ Checked confirmation checkbox');
                        }
                        break;
                    } catch {
                        continue;
                    }
                }
            }

            // Submit form using AI-determined submit action
            const submitted = await this.executeSubmitAction(page, formAnalysis.submitAction);

            if (!submitted) {
                console.log('⚠️ Could not submit form with AI detection, trying fallback methods...');
                // Try submitting via Enter key as fallback
                await page.keyboard.press('Enter');
                console.log('✅ Submitted form via Enter key (fallback)');
            }

            // Wait for submission response
            await new Promise(resolve => setTimeout(resolve, 4000));

            // Check success
            const success = await this.checkUnsubscribeSuccess(page);

            return {
                success,
                message: success ? 'Successfully unsubscribed via form submission' : 'Form submitted but success unclear',
                requiresFormFilling: true,
                formData,
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to complete form-based unsubscribe',
                error: error instanceof Error ? error.message : 'Unknown error',
                requiresFormFilling: true,
                formData,
            };
        }
    }

    private static async checkUnsubscribeSuccess(page: Page): Promise<boolean>
    {
        try {
            // Enhanced success detection
            const indicators = await page.evaluate(() =>
            {
                const text = document.body.innerText.toLowerCase();
                const title = document.title.toLowerCase();
                const url = window.location.href.toLowerCase();

                const successKeywords = [
                    'successfully unsubscribed',
                    'unsubscribe successful',
                    'you have been unsubscribed',
                    'unsubscribe confirmed',
                    'opt-out successful',
                    'removed from mailing list',
                    'subscription cancelled',
                    'no longer receive',
                    'email preferences updated',
                    'unsubscription complete',
                ];

                const textMatches = successKeywords.some(keyword => text.includes(keyword));
                const titleMatches = successKeywords.some(keyword => title.includes(keyword));
                const urlMatches = [ 'success', 'confirm', 'unsubscribed', 'complete' ].some(keyword => url.includes(keyword));

                // Check for error indicators
                const errorKeywords = [ 'error', 'failed', 'invalid', 'not found', '404', '500' ];
                const hasErrors = errorKeywords.some(keyword => text.includes(keyword) || title.includes(keyword));

                return {
                    textMatches,
                    titleMatches,
                    urlMatches,
                    hasErrors,
                    currentUrl: url,
                };
            });

            console.log('🔍 Success indicators:', indicators);

            // Return true if we have positive indicators and no errors
            return (indicators.textMatches || indicators.titleMatches || indicators.urlMatches) && !indicators.hasErrors;

        } catch (error) {
            console.warn('⚠️ Success check failed:', error);
            return false;
        }
    }

    // Rest of the methods remain the same...
    private static generateSelector(element: Element): string
    {
        if (element.id) {
            return `#${element.id}`;
        }
        if (element.className) {
            return `.${element.className.split(' ').join('.')}`;
        }
        return element.tagName.toLowerCase();
    }

    private static async updateUnsubscribeTask(
        emailId: string,
        result: UnsubscribeResult
    ): Promise<void>
    {
        try {
            await prisma.unsubscribeTask.update({
                where: { emailId },
                data: {
                    status: result.success ? 'completed' : 'failed',
                    successMessage: result.success ? result.message : undefined,
                    errorMessage: result.error || `${result.screenshotPath ? 'Screenshot: ' + result.screenshotPath : ''} ${result.finalUrl ? 'Final URL: ' + result.finalUrl : ''}`.trim(),
                    lastAttempt: new Date(),
                    attempts: {
                        increment: 1,
                    },
                },
            });
        } catch (error) {
            console.error('Failed to update unsubscribe task:', error);
        }
    }

    // Bulk unsubscribe with rate limiting
    static async bulkUnsubscribe(
        emailIds: string[],
        userEmail?: string,
        options: { delayMs?: number; maxConcurrent?: number; } = {}
    ): Promise<{ success: number; failed: number; results: UnsubscribeResult[]; }>
    {
        const { delayMs = 2000, maxConcurrent = 3 } = options;
        const results: UnsubscribeResult[] = [];
        let success = 0;
        let failed = 0;

        // Process in batches to avoid overwhelming servers
        for (let i = 0; i < emailIds.length; i += maxConcurrent) {
            const batch = emailIds.slice(i, i + maxConcurrent);

            const batchPromises = batch.map(async (emailId) =>
            {
                try {
                    const email = await prisma.email.findUnique({
                        where: { id: emailId },
                        select: { unsubscribeLink: true },
                    });

                    if (!email?.unsubscribeLink) {
                        return {
                            success: false,
                            message: 'No unsubscribe link found',
                        };
                    }

                    await prisma.unsubscribeTask.upsert({
                        where: { emailId },
                        update: {
                            status: 'pending',
                            attempts: { increment: 1 },
                            lastAttempt: new Date(),
                        },
                        create: {
                            emailId,
                            unsubscribeLink: email.unsubscribeLink,
                            status: 'pending',
                            attempts: 1,
                            lastAttempt: new Date(),
                        },
                    });

                    return await this.unsubscribeFromEmail(emailId, email.unsubscribeLink, userEmail);
                } catch (error) {
                    return {
                        success: false,
                        message: 'Processing failed',
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Count results
            batchResults.forEach(result =>
            {
                if (result.success) success++;
                else failed++;
            });

            // Delay between batches
            if (i + maxConcurrent < emailIds.length) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return { success, failed, results };
    }

    static async getUnsubscribeTaskStatus(emailId: string)
    {
        return await prisma.unsubscribeTask.findUnique({
            where: { emailId },
        });
    }

    static async retryFailedUnsubscribes(userEmail?: string): Promise<{ success: number; failed: number; }>
    {
        const failedTasks = await prisma.unsubscribeTask.findMany({
            where: {
                status: 'failed',
                attempts: { lt: 3 },
            },
        });

        let success = 0;
        let failed = 0;

        for (const task of failedTasks) {
            try {
                const email = await prisma.email.findUnique({
                    where: { id: task.emailId },
                    select: { unsubscribeLink: true },
                });

                if (!email?.unsubscribeLink) {
                    failed++;
                    continue;
                }

                const result = await this.unsubscribeFromEmail(
                    task.emailId,
                    email.unsubscribeLink,
                    userEmail
                );

                if (result.success) success++;
                else failed++;

                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch {
                failed++;
            }
        }

        return { success, failed };
    }

    private static cleanAIResponse(response: string): string
    {
        let cleaned = response.trim();

        // Remove markdown code blocks
        if (cleaned.includes('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleaned.includes('```')) {
            cleaned = cleaned.replace(/```\w*\n?/g, '').replace(/```\n?/g, '');
        }

        // Extract JSON if wrapped in extra text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[ 0 ];
        }

        return cleaned;
    }

    private static generateFieldValue(fieldName: string): string
    {
        const name = fieldName.toLowerCase();

        // Common unsubscribe form field patterns
        if (name.includes('name') || name.includes('first') || name.includes('last')) {
            return 'John Doe';
        } else if (name.includes('phone') || name.includes('mobile')) {
            return '+1234567890';
        } else if (name.includes('company') || name.includes('organization')) {
            return 'Individual';
        } else if (name.includes('address') || name.includes('street')) {
            return '123 Main St';
        } else if (name.includes('city')) {
            return 'New York';
        } else if (name.includes('state') || name.includes('province')) {
            return 'NY';
        } else if (name.includes('zip') || name.includes('postal')) {
            return '10001';
        } else if (name.includes('country')) {
            return 'United States';
        } else if (name.includes('comment') || name.includes('feedback') || name.includes('message')) {
            return 'Please unsubscribe me from all future communications.';
        } else if (name.includes('preference') || name.includes('frequency')) {
            return 'Never';
        } else if (name.includes('category') || name.includes('type')) {
            return 'All';
        } else if (name.includes('source') || name.includes('how')) {
            return 'Email link';
        } else if (name.includes('age') || name.includes('birth')) {
            return '25-34';
        } else if (name.includes('gender')) {
            return 'Prefer not to say';
        } else if (name.includes('occupation') || name.includes('job')) {
            return 'Other';
        } else if (name.includes('interest') || name.includes('topic')) {
            return 'None';
        } else {
            // Default fallback for unknown fields
            return 'N/A';
        }
    }

    private static async fillFormField(
        page: Page,
        fieldName: string,
        value: string,
        recommendations: string[]
    ): Promise<boolean>
    {
        try {
            // Try multiple selectors for the field
            const selectors = [
                `[name="${fieldName}"]`,
                `[id="${fieldName}"]`,
                `[name*="${fieldName}" i]`,
                `[id*="${fieldName}" i]`,
                `input[placeholder*="${fieldName}" i]`,
            ];

            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 3000 });

                    const elementType = await page.$eval(selector, el => el.tagName.toLowerCase());

                    if (elementType === 'select') {
                        // Handle select dropdown
                        const options = await page.evaluate((sel) =>
                        {
                            const select = document.querySelector(sel) as HTMLSelectElement;
                            return Array.from(select.options).map(opt => ({
                                value: opt.value,
                                text: opt.textContent,
                            }));
                        }, selector);

                        // Find best matching option based on recommendations
                        const matchingOption = options.find(opt =>
                        {
                            const text = opt.text?.toLowerCase() || '';
                            return text.includes('other') ||
                                text.includes('no longer interested') ||
                                text.includes('too many') ||
                                text.includes('unsubscribe');
                        });

                        if (matchingOption) {
                            await page.select(selector, matchingOption.value);
                            console.log(`✅ Filled select field ${fieldName} with: ${matchingOption.text}`);
                            return true;
                        }
                    } else if (elementType === 'input' && await page.$eval(selector, el => (el as HTMLInputElement).type === 'checkbox')) {
                        // Handle checkbox
                        const isChecked = await page.$eval(selector, el => (el as HTMLInputElement).checked);
                        if (!isChecked) {
                            await page.click(selector);
                            console.log(`✅ Checked checkbox field ${fieldName}`);
                            return true;
                        }
                    } else {
                        // Handle input/textarea
                        await page.focus(selector);
                        await page.keyboard.down('Control');
                        await page.keyboard.press('a');
                        await page.keyboard.up('Control');
                        await page.type(selector, value, { delay: 50 });
                        console.log(`✅ Filled field ${fieldName} with: ${value}`);
                        return true;
                    }
                } catch {
                    continue;
                }
            }

            console.log(`⚠️ Could not fill field ${fieldName}`);
            return false;
        } catch (error) {
            console.warn(`⚠️ Error filling field ${fieldName}:`, error);
            return false;
        }
    }

    private static async handleCheckboxes(page: Page, shouldConfirm: boolean): Promise<void>
    {
        if (!shouldConfirm) return;

        const checkboxSelectors = [
            'input[type="checkbox"][name*="confirm" i]',
            'input[type="checkbox"][id*="confirm" i]',
            'input[type="checkbox"][name*="agree" i]',
            'input[type="checkbox"][name*="accept" i]',
            'input[type="checkbox"][name*="unsubscribe" i]',
        ];

        for (const selector of checkboxSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                const isChecked = await page.$eval(selector, el => (el as HTMLInputElement).checked);
                if (!isChecked) {
                    await page.click(selector);
                    console.log('✅ Checked confirmation checkbox');
                    break;
                }
            } catch {
                continue;
            }
        }
    }

    private static async executeSubmitAction(page: Page, submitAction: { selector: string; action: 'click' | 'submit'; }): Promise<boolean>
    {
        try {
            console.log(`🎯 Executing submit action: ${submitAction.action} on ${submitAction.selector}`);

            await page.waitForSelector(submitAction.selector, { timeout: 5000 });

            if (submitAction.action === 'click') {
                await page.click(submitAction.selector);
                console.log(`✅ Clicked submit button: ${submitAction.selector}`);
            } else if (submitAction.action === 'submit') {
                await page.evaluate((selector) =>
                {
                    const form = document.querySelector(selector) as HTMLFormElement;
                    if (form) {
                        form.submit();
                    }
                }, submitAction.selector);
                console.log(`✅ Submitted form: ${submitAction.selector}`);
            }

            return true;
        } catch (error) {
            console.warn(`⚠️ Failed to execute submit action:`, error);

            // Fallback to common submit strategies
            const fallbackSelectors = [
                'input[type="submit"]',
                'button[type="submit"]',
                'button:contains("unsubscribe")',
                'button:contains("submit")',
                'button:contains("confirm")'
            ];

            for (const selector of fallbackSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 3000 });
                    await page.click(selector);
                    console.log(`✅ Submitted form via fallback: ${selector}`);
                    return true;
                } catch {
                    continue;
                }
            }

            return false;
        }
    }

    // Health check method for monitoring
    static async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        browser: boolean;
        ai: boolean;
        database: boolean;
        details: Record<string, any>;
    }>
    {
        const details: Record<string, any> = {};
        let browserHealth = false;
        let aiHealth = false;
        let dbHealth = false;

        // Test browser
        try {
            const browser = await this.initializeBrowser();
            const page = await browser.newPage();
            await page.goto('data:text/html,<html><body>Health Check</body></html>');
            await page.close();
            browserHealth = true;
            details.browser = 'Browser initialization and basic navigation working';
        } catch (error) {
            details.browser = `Browser error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        // Test AI
        try {
            const response = await this.openai.invoke('Test message - respond with "OK"');
            aiHealth = response.content === 'OK';
            details.ai = aiHealth ? 'AI responding correctly' : 'AI response unexpected';
        } catch (error) {
            details.ai = `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        // Test database
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbHealth = true;
            details.database = 'Database connection working';
        } catch (error) {
            details.database = `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        const allHealthy = browserHealth && aiHealth && dbHealth;
        const someHealthy = browserHealth || aiHealth || dbHealth;

        return {
            status: allHealthy ? 'healthy' : (someHealthy ? 'degraded' : 'unhealthy'),
            browser: browserHealth,
            ai: aiHealth,
            database: dbHealth,
            details,
        };
    }

    // Analytics method for monitoring success rates
    static async getAnalytics(days: number = 7): Promise<{
        totalAttempts: number;
        successRate: number;
        avgAttemptsPerEmail: number;
        commonFailureReasons: Array<{ reason: string; count: number; }>;
        performanceByDomain: Array<{ domain: string; successRate: number; count: number; }>;
    }>
    {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const tasks = await prisma.unsubscribeTask.findMany({
            where: {
                lastAttempt: { gte: since },
            },
        });

        // Get email data separately since relation doesn't exist
        const emailIds = tasks.map(t => t.emailId);
        const emails = await prisma.email.findMany({
            where: { id: { in: emailIds } },
            select: { id: true, fromEmail: true, unsubscribeLink: true },
        });

        const emailMap = new Map(emails.map(e => [ e.id, e ]));

        const totalAttempts = tasks.length;
        const successful = tasks.filter(t => t.status === 'completed').length;
        const successRate = totalAttempts > 0 ? successful / totalAttempts : 0;

        const avgAttemptsPerEmail = totalAttempts > 0
            ? tasks.reduce((sum, t) => sum + t.attempts, 0) / totalAttempts
            : 0;

        // Common failure reasons
        const failureReasons: Record<string, number> = {};
        tasks.filter(t => t.status === 'failed' && t.errorMessage)
            .forEach(t =>
            {
                const reason = t.errorMessage!.substring(0, 100); // Truncate for grouping
                failureReasons[ reason ] = (failureReasons[ reason ] || 0) + 1;
            });

        const commonFailureReasons = Object.entries(failureReasons)
            .map(([ reason, count ]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Performance by domain
        const domainStats: Record<string, { success: number; total: number; }> = {};
        tasks.forEach(task =>
        {
            const email = emailMap.get(task.emailId);
            if (!email?.fromEmail) return;

            const domain = email.fromEmail.split('@')[ 1 ] || 'unknown';
            if (!domainStats[ domain ]) {
                domainStats[ domain ] = { success: 0, total: 0 };
            }

            domainStats[ domain ].total++;
            if (task.status === 'completed') {
                domainStats[ domain ].success++;
            }
        });

        const performanceByDomain = Object.entries(domainStats)
            .map(([ domain, stats ]) => ({
                domain,
                successRate: stats.total > 0 ? stats.success / stats.total : 0,
                count: stats.total,
            }))
            .filter(d => d.count >= 5) // Only domains with significant volume
            .sort((a, b) => b.count - a.count);

        return {
            totalAttempts,
            successRate,
            avgAttemptsPerEmail,
            commonFailureReasons,
            performanceByDomain,
        };
    }

    // Cleanup old screenshots and logs
    static async cleanup(olderThanDays: number = 30): Promise<{
        deletedScreenshots: number;
        deletedTasks: number;
    }>
    {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        let deletedScreenshots = 0;
        let deletedTasks = 0;

        try {
            // Clean up old completed/failed tasks
            const { count } = await prisma.unsubscribeTask.deleteMany({
                where: {
                    lastAttempt: { lt: cutoffDate },
                    status: { in: [ 'completed', 'failed' ] },
                },
            });
            deletedTasks = count;

            // Note: Screenshot cleanup would require file system operations
            // This is a placeholder for the logic
            console.log(`Cleanup completed: ${deletedTasks} tasks deleted`);

        } catch (error) {
            console.error('Cleanup failed:', error);
        }

        return { deletedScreenshots, deletedTasks };
    }
}
