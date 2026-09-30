export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Account Executive' | 'Product Marketing Manager' | 'Sales Leader' | 'Founder';
  company: string;
  createdAt: string;
  isDemoUser: boolean;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

const STORAGE_SESSION_KEY = 'nexora_auth_session';
const STORAGE_USERS_KEY = 'nexora_auth_registered_users';

// Pre-seeded demo accounts for instant hackathon review
const DEFAULT_DEMO_USERS: UserProfile[] = [
  {
    id: 'usr_demo_ae_01',
    email: 'alex.morgan@nexora.io',
    name: 'Alex Morgan',
    role: 'Account Executive',
    company: 'Nexus Platforms',
    createdAt: '2026-09-01T10:00:00Z',
    isDemoUser: true,
  },
  {
    id: 'usr_demo_pmm_02',
    email: 'sarah.chen@nexora.io',
    name: 'Sarah Chen',
    role: 'Product Marketing Manager',
    company: 'CloudVector Labs',
    createdAt: '2026-09-10T14:30:00Z',
    isDemoUser: true,
  },
  {
    id: 'usr_demo_founder_03',
    email: 'david.kim@nexora.io',
    name: 'David Kim',
    role: 'Founder',
    company: 'Apex Robotics',
    createdAt: '2026-09-15T08:15:00Z',
    isDemoUser: true,
  },
];

// In-memory demo password map for validation
const DEMO_CREDENTIALS: Record<string, string> = {
  'alex.morgan@nexora.io': 'NexoraSales2026!',
  'sarah.chen@nexora.io': 'NexoraPMM2026!',
  'david.kim@nexora.io': 'NexoraFounder2026!',
};

export class AuthDemoService {
  private static getRegisteredUsers(): UserProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY) || localStorage.getItem('radar_auth_registered_users');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[NexoraAuth] Failed to load local users storage', e);
    }
    return DEFAULT_DEMO_USERS;
  }

  private static saveRegisteredUsers(users: UserProfile[]) {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('[NexoraAuth] Failed to save local users storage', e);
    }
  }

  static getStoredSession(): AuthSession | null {
    try {
      const item = localStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem('radar_auth_session');
      if (!item) return null;
      const session: AuthSession = JSON.parse(item);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static saveStoredSession(session: AuthSession) {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('[NexoraAuth] Failed to store session', e);
    }
  }

  static clearStoredSession() {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      localStorage.removeItem('radar_auth_session');
    } catch (e) {
      console.warn('[NexoraAuth] Failed to clear session', e);
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    return this.signIn(email, password);
  }

  static async signUpWithEmail(params: {
    name: string;
    email: string;
    password: string;
    role: UserProfile['role'];
    company: string;
  }): Promise<AuthSession> {
    return this.signUp(params);
  }

  static async signInQuickDemo(userKey: 'alex' | 'sarah' | 'david'): Promise<AuthSession> {
    return this.quickDemoLogin(userKey);
  }

  static async signIn(email: string, password: string): Promise<AuthSession> {
    // Simulate real network auth latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedEmail = email.trim().toLowerCase();

    // Check credentials against registered demo users
    const allUsers = this.getRegisteredUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!existing) {
      throw new Error('No account found with this email address. Please check spelling or create an account.');
    }

    const expectedPassword = DEMO_CREDENTIALS[normalizedEmail];
    if (expectedPassword && password !== expectedPassword && password !== 'Nexora123!') {
      throw new Error('Invalid password. Please check your credentials and try again.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const session: AuthSession = {
      user: existing,
      token: `demo_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    this.saveStoredSession(session);
    return session;
  }

  static async signUp(params: {
    name: string;
    email: string;
    password: string;
    role: UserProfile['role'];
    company: string;
  }): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 750));

    const normalizedEmail = params.email.trim().toLowerCase();

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Please enter a valid work email address.');
    }

    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    if (!params.name.trim()) {
      throw new Error('Please enter your full name.');
    }

    if (!params.company.trim()) {
      throw new Error('Please enter your company or workspace name.');
    }

    const allUsers = this.getRegisteredUsers();
    if (allUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      name: params.name.trim(),
      role: params.role,
      company: params.company.trim(),
      createdAt: new Date().toISOString(),
      isDemoUser: true,
    };

    allUsers.push(newUser);
    this.saveRegisteredUsers(allUsers);
    DEMO_CREDENTIALS[normalizedEmail] = params.password;

    const session: AuthSession = {
      user: newUser,
      token: `demo_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    this.saveStoredSession(session);
    return session;
  }

  static async quickDemoLogin(userKey: 'alex' | 'sarah' | 'david'): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const target =
      userKey === 'sarah'
        ? DEFAULT_DEMO_USERS[1]
        : userKey === 'david'
        ? DEFAULT_DEMO_USERS[2]
        : DEFAULT_DEMO_USERS[0];

    const session: AuthSession = {
      user: target,
      token: `demo_quick_${target.id}_${Date.now()}`,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    this.saveStoredSession(session);
    return session;
  }

  static async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.clearStoredSession();
  }
}
