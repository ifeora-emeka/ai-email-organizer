export interface Category {
  id: string
  name: string
  description: string
  emailCount: number
  color: string
}

export interface GmailAccount {
  id: string
  email: string
  name: string
  isActive: boolean
  lastSync: Date
  emailCount: number
}

export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Work",
    description: "Work-related emails and communications",
    emailCount: 2,
    color: "bg-blue-500"
  },
  {
    id: "2", 
    name: "Personal",
    description: "Personal emails and family communications",
    emailCount: 1,
    color: "bg-green-500"
  },
  {
    id: "3",
    name: "Shopping",
    description: "Shopping receipts and promotional emails",
    emailCount: 2,
    color: "bg-purple-500"
  },
  {
    id: "4",
    name: "News",
    description: "News alerts and newsletter subscriptions",
    emailCount: 1,
    color: "bg-orange-500"
  },
  {
    id: "5",
    name: "Social",
    description: "Social media notifications and updates",
    emailCount: 1,
    color: "bg-pink-500"
  },
  {
    id: "6",
    name: "Security",
    description: "Security alerts and authentication notifications",
    emailCount: 1,
    color: "bg-red-500"
  }
]

export const mockGmailAccounts: GmailAccount[] = [
  {
    id: "1",
    email: "john.doe@gmail.com",
    name: "John Doe",
    isActive: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 15),
    emailCount: 5,
  },
  {
    id: "2",
    email: "jane.smith@gmail.com",
    name: "Jane Smith",
    isActive: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2),
    emailCount: 2,
  },
  {
    id: "3",
    email: "work.account@company.com",
    name: "Work Account",
    isActive: false,
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24),
    emailCount: 1,
  },
]

export const categoryColors = [
  "bg-blue-500",
  "bg-green-500", 
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-cyan-500"
]