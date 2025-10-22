
import { Mission } from './types';

export const ONGOING_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Master the core concepts of React, including components, state, and props.',
    progress: 75,
    tags: ['Frontend', 'JavaScript'],
  },
  {
    id: 2,
    title: 'Advanced CSS with Tailwind',
    description: 'Learn advanced styling techniques and build complex, responsive layouts with Tailwind CSS.',
    progress: 40,
    tags: ['CSS', 'UI/UX'],
  },
];

export const AVAILABLE_MISSIONS: Mission[] = [
  {
    id: 3,
    title: 'TypeScript for Professionals',
    description: 'Deep dive into TypeScript to write scalable and maintainable applications.',
    tags: ['Frontend', 'JavaScript'],
  },
  {
    id: 4,
    title: 'State Management with Redux',
    description: 'Understand and implement global state management in large-scale applications.',
    tags: ['React', 'State Management'],
  },
  {
    id: 5,
    title: 'UI/UX Design Principles',
    description: 'Learn the fundamental principles of user interface and user experience design.',
    tags: ['Design', 'UI/UX'],
  },
  {
    id: 6,
    title: 'Backend with Node.js & Express',
    description: 'Build robust and efficient backend services and APIs with Node.js.',
    tags: ['Backend', 'JavaScript'],
  },
];
