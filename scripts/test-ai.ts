import { AIService, EmailContent } from '../lib/services/ai.service';

async function testAIService()
{
    console.log('Testing AI Service with LangChain...\n');

    // Mock categories
    const categories = [
        {
            id: '1',
            name: 'Work',
            description: 'Professional emails, work-related communications, business updates',
            color: 'bg-blue-500',
            userId: 'test-user'
        },
        {
            id: '2',
            name: 'Personal',
            description: 'Personal emails, family communications, social updates',
            color: 'bg-green-500',
            userId: 'test-user'
        },
        {
            id: '3',
            name: 'Newsletters',
            description: 'Newsletters, subscriptions, marketing emails',
            color: 'bg-purple-500',
            userId: 'test-user'
        }
    ];

    // Test email content
    const emailContent: EmailContent = {
        subject: 'Weekly Team Meeting Reminder',
        fromEmail: 'manager@company.com',
        fromName: 'John Manager',
        body: `Hi team,

Just a reminder that we have our weekly team meeting tomorrow at 10 AM.
Please prepare your updates on current projects and any blockers you're facing.

Agenda:
- Project status updates
- Resource allocation discussion
- Q&A session

Looking forward to seeing everyone there!

Best regards,
John`
    };

    try {
        console.log('Testing email categorization...');
        const result = await AIService.categorizeAndSummarizeEmail(emailContent, categories);

        if (result) {
            console.log('✅ Categorization successful!');
            console.log('Category:', result.categoryName);
            console.log('Confidence:', result.confidence);
            console.log('Priority:', result.priority);
            console.log('Summary:', result.summary);
            console.log('Unsubscribe Link:', result.unsubscribeLink || 'None');
        } else {
            console.log('❌ Categorization failed - no result returned');
        }

        console.log('\nTesting unsubscribe link extraction...');
        const unsubscribeLink = await AIService.extractUnsubscribeLink(emailContent);
        console.log('Unsubscribe Link:', unsubscribeLink || 'None found');

    } catch (error) {
        console.error('❌ AI Service test failed:', error);

        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                console.log('\n💡 Make sure OPENAI_API_KEY is set in your environment variables');
            }
        }
    }
}

// Run the test
testAIService().catch(console.error);
