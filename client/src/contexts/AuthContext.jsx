<<<<<<< HEAD
=======
// import { createContext, useContext, useEffect, useState } from 'react';

// const AuthContext = createContext();
// export const useAuth = () => useContext(AuthContext);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) setUser(JSON.parse(storedUser));
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, setUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }


>>>>>>> master
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
<<<<<<< HEAD

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
=======
  const [isLoading, setIsLoading] = useState(true); // NEW

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false); // Done loading
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
>>>>>>> master
