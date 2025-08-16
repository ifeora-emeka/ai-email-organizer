export interface MockEmail {
  id: string
  subject: string
  fromEmail: string
  fromName: string
  receivedAt: string
  aiSummary: string
  body: string
  hasAttachments: boolean
  isRead: boolean
  category: string
  aiConfidence: number
  priority: 'high' | 'medium' | 'low'
}

export const mockEmails: MockEmail[] = [
  {
    id: '1',
    subject: 'Welcome to your new AI-powered email organizer!',
    fromEmail: 'no-reply@email-organizer.com',
    fromName: 'AI Email Organizer',
    receivedAt: '2025-08-16T10:30:00Z',
    aiSummary: 'Welcome email introducing the AI email organizer features and capabilities. Contains getting started guide and feature overview.',
    body: `Dear User,

Welcome to AI Email Organizer! We're excited to help you take control of your inbox with the power of artificial intelligence.

Here's what you can do with our platform:
- Automatically categorize emails using AI
- Get smart summaries of your emails
- Bulk actions to manage your inbox efficiently
- One-click unsubscribe from unwanted emails

Getting started is easy:
1. Connect your Gmail accounts
2. Create custom categories
3. Let our AI organize your emails automatically

Best regards,
The AI Email Organizer Team`,
    hasAttachments: false,
    isRead: false,
    category: 'Personal',
    aiConfidence: 0.95,
    priority: 'medium'
  },
  {
    id: '2',
    subject: 'Your Weekly Newsletter - Tech Updates',
    fromEmail: 'newsletter@techblog.com',
    fromName: 'TechBlog Weekly',
    receivedAt: '2025-08-16T09:15:00Z',
    aiSummary: 'Weekly tech newsletter covering AI advancements, new programming frameworks, and industry news. Highlights include GPT-5 announcement and quantum computing breakthrough.',
    body: `This week in tech:

🤖 AI & Machine Learning
- GPT-5 officially announced by OpenAI
- New breakthrough in quantum computing by IBM
- AI chip shortage expected to continue through 2025

💻 Development
- React 19 beta now available
- New Python 3.12 features overview
- Node.js security update released

📱 Mobile
- iOS 18 developer preview
- Android 15 beta features
- Flutter 4.0 roadmap announced

Stay updated with the latest in technology!`,
    hasAttachments: true,
    isRead: true,
    category: 'News',
    aiConfidence: 0.88,
    priority: 'low'
  },
  {
    id: '3',
    subject: 'Project Deadline Reminder - Q3 Reports',
    fromEmail: 'jane.manager@company.com',
    fromName: 'Jane Manager',
    receivedAt: '2025-08-16T08:45:00Z',
    aiSummary: 'Urgent reminder about Q3 report deadline approaching on Friday. Requests status update and offers support for completion.',
    body: `Hi John,

This is a friendly reminder that the Q3 reports are due this Friday, August 18th.

Please ensure you have:
- Completed all data analysis
- Prepared the executive summary
- Reviewed the financial projections
- Submitted for peer review

If you need any assistance or have questions, please don't hesitate to reach out.

Best regards,
Jane`,
    hasAttachments: false,
    isRead: false,
    category: 'Work',
    aiConfidence: 0.92,
    priority: 'high'
  },
  {
    id: '4',
    subject: 'Flash Sale: 50% Off All Items - Limited Time!',
    fromEmail: 'sales@onlinestore.com',
    fromName: 'Online Store',
    receivedAt: '2025-08-16T07:20:00Z',
    aiSummary: 'Promotional email advertising a 50% off flash sale on all items. Sale ends in 24 hours with free shipping on orders over $50.',
    body: `🎉 FLASH SALE ALERT! 🎉

50% OFF EVERYTHING!
Limited time offer - Sale ends in 24 hours!

✨ FREE SHIPPING on orders over $50
🚀 Express delivery available
💳 Easy returns within 30 days

Use code: FLASH50

Shop now before it's too late!
[Shop Now Button]

This email was sent to john.doe@gmail.com
To unsubscribe, click here.`,
    hasAttachments: false,
    isRead: true,
    category: 'Shopping',
    aiConfidence: 0.97,
    priority: 'low'
  },
  {
    id: '5',
    subject: 'Security Alert: New Device Login Detected',
    fromEmail: 'security@gmail.com',
    fromName: 'Gmail Security',
    receivedAt: '2025-08-16T06:10:00Z',
    aiSummary: 'Security notification about new device login from Windows computer in New York. No action required if this was you, otherwise secure account immediately.',
    body: `Security Alert

We detected a new sign-in to your Google Account.

Device: Windows Computer
Location: New York, NY, USA
Time: August 16, 2025 at 6:10 AM EDT

If this was you, you can ignore this alert. If not, we recommend:
- Changing your password immediately
- Reviewing your account activity
- Enabling 2-factor authentication

Review Activity: [Link]
Secure Account: [Link]

Google Security Team`,
    hasAttachments: false,
    isRead: false,
    category: 'Security',
    aiConfidence: 0.99,
    priority: 'high'
  },
  {
    id: '6',
    subject: 'Meeting Invitation: Weekly Team Standup',
    fromEmail: 'sarah.lead@company.com',
    fromName: 'Sarah Team Lead',
    receivedAt: '2025-08-15T16:30:00Z',
    aiSummary: 'Team meeting invitation for weekly standup on Monday at 9 AM. Includes agenda items and meeting room details.',
    body: `Hi Team,

You're invited to our weekly team standup meeting.

Date: Monday, August 19, 2025
Time: 9:00 AM - 9:30 AM EST
Location: Conference Room A / Zoom

Agenda:
- Sprint review
- Upcoming deadlines
- Blocker discussions
- New project assignments

Please come prepared with your updates.

Best,
Sarah`,
    hasAttachments: false,
    isRead: true,
    category: 'Work',
    aiConfidence: 0.94,
    priority: 'medium'
  },
  {
    id: '7',
    subject: 'Your LinkedIn Weekly Digest',
    fromEmail: 'noreply@linkedin.com',
    fromName: 'LinkedIn',
    receivedAt: '2025-08-15T14:20:00Z',
    aiSummary: 'Weekly LinkedIn digest with job recommendations, network updates, and industry news relevant to your profile.',
    body: `This week on LinkedIn:

👥 Your Network
- 5 new connections made
- 12 profile views this week
- 3 endorsements received

💼 Job Opportunities
- Senior Developer at Tech Corp
- Product Manager at StartupCo
- UX Designer at Design Studio

📈 Industry Updates
- Tech sector continues growth
- Remote work trends in 2025
- AI adoption in enterprises

Stay connected and discover opportunities!`,
    hasAttachments: false,
    isRead: false,
    category: 'Social',
    aiConfidence: 0.89,
    priority: 'low'
  },
  {
    id: '8',
    subject: 'Amazon Order Confirmation - Your order has shipped',
    fromEmail: 'auto-confirm@amazon.com',
    fromName: 'Amazon',
    receivedAt: '2025-08-15T12:45:00Z',
    aiSummary: 'Order confirmation for Amazon purchase. Package has shipped and will arrive in 2-3 business days. Includes tracking information.',
    body: `Hello John,

Your Amazon order has shipped!

Order #: 123-4567890-1234567
Shipped: August 15, 2025
Estimated Delivery: August 17-18, 2025

Items:
- Wireless Bluetooth Headphones (Qty: 1)
- USB-C Cable 6ft (Qty: 2)

Track your package: [Tracking Link]

Thanks for shopping with Amazon!`,
    hasAttachments: false,
    isRead: false,
    category: 'Shopping',
    aiConfidence: 0.98,
    priority: 'medium'
  }
]