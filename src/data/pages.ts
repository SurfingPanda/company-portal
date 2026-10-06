export interface PlaceholderRoute {
  path: string
  title: string
  description: string
  message: string
}

/** Routes that are not built yet. Each renders the shared placeholder page. */
export const placeholderRoutes: PlaceholderRoute[] = [
  {
    path: '/help',
    title: 'Help',
    description: 'Guides and answers for using the employee portal.',
    message: 'Help resources will be available here.',
  },
  {
    path: '/contact-mis',
    title: 'Contact MIS',
    description: 'Reach the Management Information Systems department.',
    message: 'MIS contact details will be available here.',
  },
]
