/**
 * Authentication Module for Taskly
 * Handles User Registration, Login, Logout, and Current Session.
 */

const AUTH_KEYS = {
  USERS: 'taskly_registered_users',
  CURRENT_USER: 'taskly_current_user'
};

export const Auth = {
  getCurrentUser() {
    const data = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
    }
  },

  getRegisteredUsers() {
    const data = localStorage.getItem(AUTH_KEYS.USERS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  saveRegisteredUsers(users) {
    localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
  },

  register(name, email, password) {
    const cleanEmail = email.toLowerCase().trim();
    const users = this.getRegisteredUsers();
    
    if (users.some(u => u.email === cleanEmail)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password, // In production this would be hashed
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  login(email, password) {
    const cleanEmail = email.toLowerCase().trim();
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.email === cleanEmail && u.password === password);

    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  },

  logout() {
    this.setCurrentUser(null);
  }
};
