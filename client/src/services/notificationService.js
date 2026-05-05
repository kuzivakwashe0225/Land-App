const API_URL = '/api/notifications';

// Get all notifications
export const getNotifications = async (limit = 20, page = 1, unreadOnly = false) => {
  try {
    const response = await fetch(
      `${API_URL}?limit=${limit}&page=${page}&unreadOnly=${unreadOnly}`,
      {
        method: 'GET',
        credentials: 'include'
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    const response = await fetch(`${API_URL}/unread/count`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Get notification by ID
export const getNotificationById = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/${notificationId}`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/${notificationId}/read`, {
      method: 'PUT',
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await fetch(`${API_URL}/read/all`, {
      method: 'PUT',
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  try {
    const response = await fetch(`${API_URL}/delete/all`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Poll for new notifications (call periodically)
export const pollNotifications = async (lastCheckTime) => {
  try {
    const response = await fetch(
      `${API_URL}?limit=50&unreadOnly=true`,
      {
        method: 'GET',
        credentials: 'include'
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error polling notifications:', error);
    throw error;
  }
};

export default {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  pollNotifications
};
