export type NotificationItem = { key: string; title: string; description: string; href: string; date: string; isRead: boolean };
export type NotificationResponse = { notifications: NotificationItem[]; unreadCount: number };
export const notificationRefreshEvent = "securitask:notifications-updated";
