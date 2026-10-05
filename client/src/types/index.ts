export type Role = 'ADMIN' | 'CHAIRMAN' | 'MEMBER';
export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  member?: Member | null;
}
export interface Member {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string | null;
  user?: User;
  _count?: { applications: number };
}
export interface Attachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}
export interface Application {
  id: string;
  number: number;
  memberId: string;
  member?: Member;
  type: string;
  title: string;
  description: string;
  amount?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  comments?: { id: string; text: string; createdAt: string; user: User }[];
  history?: { id: string; oldStatus?: string; newStatus: string; createdAt: string; user?: User }[];
  attachments?: Attachment[];
}
export interface News {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  image?: string | null;
  authorId: string;
  author?: User;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  image?: string | null;
  organizer: string;
  status: string;
  participants?: number;
  isParticipating?: boolean;
  createdAt: string;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Overview {
  members: number;
  activeMembers: number;
  activeApplications: number;
  approvedApplications: number;
  news: number;
  documents: number;
  events: number;
}
export interface Settings {
  organizationName: string;
  schoolName: string;
  description: string;
  email: string;
  phone: string;
  address: string;
}
