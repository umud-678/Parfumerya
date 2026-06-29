import { Navigate } from 'react-router-dom';

export default function OrdersPage() {
  return <Navigate to="/account?tab=orders" replace />;
}
