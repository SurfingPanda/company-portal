import type { KnowledgeBaseArticle, KnowledgeBaseBlock, KnowledgeBaseCategory } from '@/types/knowledgeBase'

/**
 * SAMPLE KNOWLEDGE-BASE ARTICLES (development only).
 *
 * Generic IT guidance used to build and test the interface. These are NOT official Eljin Corporation
 * procedures, and the company is not stated to use any particular product. Replaced by
 * `GET /api/helpdesk/knowledge-base` once the backend exists. Articles never ask for passwords.
 */

interface Seed {
  title: string
  category: KnowledgeBaseCategory
  summary: string
  steps: string[]
  tags: string[]
  /** Days before now. */
  daysAgo: number
  featured?: boolean
}

const sampleNote = 'Sample article for development. These steps are generic guidance, not an official Eljin Corporation procedure.'
const securityNote = 'Never share your password or any verification code with anyone, including IT staff or in a support ticket.'

const iso = (daysAgo: number) => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00:00`
}

const seeds: Seed[] = [
  { title: 'How to Connect to Office Wi-Fi', category: 'network', summary: 'General steps for joining a wireless network from a laptop or phone.', steps: ['Turn on Wi-Fi on your device.', 'Choose the office network from the list of available networks.', 'Sign in with your own account if you are asked to.', 'If it fails, forget the network and try again, then contact IT.'], tags: ['wi-fi', 'wifi', 'wireless', 'network', 'connect'], daysAgo: 8, featured: true },
  { title: 'What to Do When Your Password Expires', category: 'accounts', summary: 'What to expect when a password expires and where to change it.', steps: ['Follow the on-screen prompt to choose a new password.', 'Pick a password you have not used elsewhere.', 'Update the password saved on your phone or other devices.', 'If you are locked out, submit a ticket without including the password.'], tags: ['password', 'password reset', 'expire', 'account', 'locked out'], daysAgo: 5, featured: true },
  { title: 'Basic Printer Troubleshooting', category: 'printers', summary: 'Quick checks to try when a printer will not print.', steps: ['Check the printer is on and has paper and toner.', 'Clear any error shown on the printer screen.', 'Make sure you selected the correct printer.', 'Restart the print job, then the printer.', 'If it still fails, submit a ticket with the printer name or location.'], tags: ['printer', 'printing', 'paper jam', 'print'], daysAgo: 12, featured: true },
  { title: 'How to Restart Microsoft Teams', category: 'microsoft-365', summary: 'Fully close and reopen the Teams app when it freezes.', steps: ['Close the Teams window.', 'Quit Teams from the system tray or taskbar.', 'Open Teams again from the Start menu.', 'If the problem remains, restart your computer.'], tags: ['teams', 'microsoft 365', 'freezing', 'meeting'], daysAgo: 14 },
  { title: 'What Information to Include in an IT Ticket', category: 'general', summary: 'Details that help IT resolve your request faster.', steps: ['Describe what you were trying to do.', 'Copy any error message exactly as shown.', 'Note when it started and how often it happens.', 'Mention the device and where you are working.', 'Attach a screenshot if it helps. Do not include passwords.'], tags: ['ticket', 'helpdesk', 'support', 'request'], daysAgo: 3, featured: true },
  { title: 'Setting Up Multi-Factor Authentication (MFA)', category: 'security', summary: 'General guidance on adding a second step to sign-in.', steps: ['Open your account security settings.', 'Choose an authenticator method offered to you.', 'Follow the prompts to link your device.', 'Keep your recovery options up to date.'], tags: ['mfa', 'multi-factor', 'two-factor', 'authenticator', 'security'], daysAgo: 20 },
  { title: 'Fixing a Slow Computer', category: 'hardware', summary: 'Simple steps to try when your computer feels slow.', steps: ['Save your work and restart the computer.', 'Close programs and browser tabs you are not using.', 'Check that updates are not running in the background.', 'Free up disk space if the drive is almost full.', 'Submit a ticket if it stays slow.'], tags: ['computer slow', 'slow', 'performance', 'laptop', 'freezing'], daysAgo: 9 },
  { title: 'Connecting to the VPN from Home', category: 'remote-work', summary: 'General steps for reaching internal systems while working remotely.', steps: ['Check your home internet connection first.', 'Open the VPN app provided to you.', 'Sign in with your own account.', 'Wait for the connected status before opening internal systems.'], tags: ['vpn', 'remote', 'work from home', 'remote access'], daysAgo: 16, featured: true },
  { title: 'Setting Up Company Email on Your Phone', category: 'microsoft-365', summary: 'General steps for adding a work email account to a mobile device.', steps: ['Open the mail app on your phone.', 'Choose to add a work account.', 'Sign in with your own account details.', 'Accept any security prompts that apply.'], tags: ['email', 'mobile', 'phone', 'outlook', 'mail'], daysAgo: 22 },
  { title: 'My Email Is Not Sending or Receiving', category: 'microsoft-365', summary: 'Checks to try when email stops working.', steps: ['Check your internet connection.', 'Look for a full mailbox warning.', 'Restart your mail app.', 'Try the web version of mail.', 'Submit a ticket with any error message.'], tags: ['email', 'outlook', 'mailbox', 'not sending'], daysAgo: 7 },
  { title: 'How to Request Access to a System', category: 'accounts', summary: 'Where to ask for access to a company application.', steps: ['Use Forms & Requests to submit a System Access Request.', 'State which system and why you need access.', 'Wait for the request to be processed.', 'Do not share your login with a colleague.'], tags: ['access', 'permission', 'system access', 'account'], daysAgo: 11 },
  { title: 'Locked Out of Your Account', category: 'accounts', summary: 'What to do if you cannot sign in.', steps: ['Check that Caps Lock is off.', 'Wait a few minutes, then try once more.', 'Use the self-service reset option if one is available.', 'Otherwise submit a ticket. Do not include your password.'], tags: ['locked out', 'login', 'sign in', 'password reset', 'account'], daysAgo: 4 },
  { title: 'Spotting a Suspicious Email', category: 'security', summary: 'Common signs of phishing and what to do.', steps: ['Check the sender address carefully.', 'Be wary of urgent requests for money or credentials.', 'Do not click links or open attachments you did not expect.', 'Report it to IT through a ticket.'], tags: ['phishing', 'spam', 'suspicious', 'security', 'email'], daysAgo: 18 },
  { title: 'Wi-Fi Connected but No Internet', category: 'network', summary: 'Steps to try when you are connected but pages will not load.', steps: ['Turn Wi-Fi off and on again.', 'Try another website or app.', 'Restart your device.', 'Move closer to the access point.', 'Report the location in a ticket if others are affected.'], tags: ['wi-fi', 'internet', 'network', 'no internet', 'slow'], daysAgo: 13 },
  { title: 'Your Laptop Will Not Turn On', category: 'hardware', summary: 'Basic checks before contacting IT.', steps: ['Check the charger is firmly connected.', 'Hold the power button for several seconds.', 'Try a different outlet.', 'Submit a ticket with the device type and any asset tag.'], tags: ['laptop', 'power', 'will not start', 'hardware'], daysAgo: 25 },
  { title: 'Adding a Printer to Your Computer', category: 'printers', summary: 'General steps for connecting to a shared printer.', steps: ['Open your computer printer settings.', 'Choose to add a printer.', 'Select the printer from the list.', 'Print a test page.'], tags: ['printer', 'add printer', 'setup', 'print'], daysAgo: 30 },
  { title: 'Using Remote Access Safely', category: 'remote-work', summary: 'Good habits when working away from the office.', steps: ['Use only company-approved connections.', 'Lock your screen when you step away.', 'Avoid public Wi-Fi for sensitive work.', 'Sign out when you finish.'], tags: ['remote', 'security', 'public wi-fi', 'work from home'], daysAgo: 28 },
  { title: 'Installing Approved Software', category: 'general', summary: 'How to ask for software you need for your work.', steps: ['Check whether the software is already available to you.', 'Submit a request through Forms & Requests.', 'Explain what you need it for.', 'Do not install unapproved programs.'], tags: ['software', 'install', 'request', 'application'], daysAgo: 21 },
  { title: 'Mobile Device Setup Tips', category: 'general', summary: 'General tips for setting up a work-related phone or tablet.', steps: ['Keep the operating system up to date.', 'Use a screen lock.', 'Install apps only from the official store.', 'Report a lost device to IT promptly.'], tags: ['mobile', 'phone', 'tablet', 'device'], daysAgo: 35 },
  { title: 'Clearing Your Browser Cache', category: 'general', summary: 'A quick fix for pages that load incorrectly.', steps: ['Open your browser settings.', 'Find the option to clear browsing data.', 'Choose cached images and files.', 'Reload the page.'], tags: ['browser', 'cache', 'website', 'slow'], daysAgo: 40 },
]

const buildContent = (seed: Seed): KnowledgeBaseBlock[] => [
  { type: 'paragraph', text: seed.summary },
  { type: 'heading', text: 'Steps to try' },
  { type: 'list', items: seed.steps },
  ...(seed.category === 'accounts' || seed.category === 'security' ? ([{ type: 'paragraph', text: securityNote }] as KnowledgeBaseBlock[]) : []),
  { type: 'paragraph', text: sampleNote },
]

export const knowledgeBaseArticles: KnowledgeBaseArticle[] = seeds.map((seed, index) => ({
  id: `kb-${String(index + 1).padStart(3, '0')}`,
  title: seed.title,
  summary: seed.summary,
  content: buildContent(seed),
  category: seed.category,
  tags: seed.tags,
  updatedAt: iso(seed.daysAgo),
  author: 'MIS Department',
  isFeatured: seed.featured,
  isSample: true,
}))
