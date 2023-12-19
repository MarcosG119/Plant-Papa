import { Navigate } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ProtectedRoute = ({children, user}: {children: React.ReactNode, user: any}) => {
    return user ? children : <Navigate to='/login' />;
};