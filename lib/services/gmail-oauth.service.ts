export interface GmailOAuthResponse {
  access_token: string
  refresh_token?: string
  scope: string
  expires_in: number
  token_type: string
}

export interface GmailProfile {
  email: string
  name?: string
  picture?: string
  verified_email: boolean
}

export class GmailOAuthService {
  private clientId: string
  private redirectUri: string
  private scope: string

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    this.redirectUri = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/gmail/callback`
    this.scope = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent'
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string): Promise<GmailOAuthResponse> {
    // This should be called from the server-side API route
    const response = await fetch('/api/auth/gmail/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    return response.json()
  }

  async getGmailProfile(accessToken: string): Promise<GmailProfile> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get Gmail profile')
    }

    return response.json()
  }
}
