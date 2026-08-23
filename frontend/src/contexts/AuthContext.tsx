import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organization?: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (...args: any[]) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<any>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (...credentials: any[]) => {
    try {
      setIsLoading(true);
      
      const mockResponse = await mockAuthAPI(credentials);
      
      if (mockResponse.success) {
        const { user: userData, token } = mockResponse.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        throw new Error((mockResponse as any).message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      
      const mockResponse = await mockRegisterAPI(userData);
      
      if (mockResponse.success) {
        const { user: newUser, token } = mockResponse.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(newUser));
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      } else {
        throw new Error((mockResponse as any).message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData: any) => {
    try {
      setIsLoading(true);
      
      const updatedUser = { ...user, ...profileData };
      
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.message || 'Profile update failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasPermission = (permission: string) => {
    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'manage_users', 'export_data', 'system_settings'],
      operator: ['read', 'write', 'export_data'],
      viewer: ['read']
    };
    
    return rolePermissions[user?.role]?.includes(permission) || false;
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const mockAuthAPI = async (credentials: any) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const { email, password } = credentials;
  const mockUsers = [
    {
      id: '1',
      email: 'admin@orbitops.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin',
      avatar: null
    }
  ];
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: { user: userWithoutPassword, token: `mock_token_${user.id}` } };
  }
  return { success: false, message: 'Invalid email or password' };
};

const mockRegisterAPI = async (userData: any) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const { email, name, role = 'viewer' } = userData;
  const newUser = { id: Date.now().toString(), email, name, role, avatar: null };
  return { success: true, data: { user: newUser, token: `mock_token_${newUser.id}` } };
};

export default AuthContext;