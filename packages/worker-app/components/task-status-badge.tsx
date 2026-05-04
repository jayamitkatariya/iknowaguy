interface TaskStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700 border-blue-200" },
  assigned: { label: "Assigned", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  submitted: { label: "Submitted", color: "bg-purple-100 text-purple-700 border-purple-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}