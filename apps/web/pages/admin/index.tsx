import { GetServerSideProps } from 'next';
import { UserManagement } from '../../components/admin/UserManagement';
import { JobModeration } from '../../components/admin/JobModeration';
import { checkAdmin } from '../../utils/auth';

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return {
      redirect: {
        destination: '/403',
        permanent: false,
      },
    };
  }
  return { props: {} };
};

const AdminPanel = () => (
  <div className="admin-panel">
    <h1>Admin Dashboard</h1>
    <UserManagement />
    <JobModeration />
  </div>
);

export default AdminPanel;
