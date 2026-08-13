import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Card, EmptyState } from '../components/ui';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Card>
      <EmptyState title="Page not found" message="That route does not exist." icon={Compass} />
      <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
        Back to dashboard
      </button>
    </Card>
  );
};

export default NotFound;
