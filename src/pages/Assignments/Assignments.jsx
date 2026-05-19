import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import StatCard   from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import { Card, CardHeader, CardTitle } from '../../components/ui';

export default function Assignments() {
  return (
    <div className="page-content">
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard icon={BookOpen}    count={0} label="Total Assignments" colorClass="indigo" />
        <StatCard icon={CheckCircle} count={0} label="Completed"         colorClass="green"  />
        <StatCard icon={AlertCircle} count={0} label="Overdue"           colorClass="red"    />
      </div>

      <Card>
        <CardHeader>
          <CardTitle><BookOpen size={18} color="#4f46e5" /> Assignments</CardTitle>
        </CardHeader>
        <EmptyState icon={BookOpen} message="No assignments assigned yet." />
      </Card>
    </div>
  );
}
