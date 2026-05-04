import Link from "next/link";
import TaskStatusBadge from "./task-status-badge";

interface BountyCardProps {
  bounty: {
    id: string;
    title: string;
    description?: string;
    category?: string;
    location_city?: string;
    location_country?: string;
    price?: number;
    price_type?: string;
    status?: string;
    deadline?: string;
  };
}

export default function BountyCard({ bounty }: BountyCardProps) {
  return (
    <Link href={`/task/${bounty.id}`}>
      <div className="bg-white rounded-lg shadow-sm border p-5 hover:border-indigo-300 transition cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">{bounty.title}</h3>
              {bounty.status && <TaskStatusBadge status={bounty.status} />}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {bounty.description?.slice(0, 100)}
              {bounty.description && bounty.description.length > 100 ? "..." : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {bounty.category && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {bounty.category}
                </span>
              )}
              {bounty.location_city && (
                <span className="text-xs text-gray-500">
                  📍 {bounty.location_city}{bounty.location_country ? `, ${bounty.location_country}` : ""}
                </span>
              )}
              {bounty.deadline && (
                <span className="text-xs text-gray-500">
                  ⏰ {new Date(bounty.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <span className="text-2xl font-bold text-indigo-600">
              ${bounty.price || 0}
            </span>
            {bounty.price_type && bounty.price_type !== "none" && (
              <p className="text-xs text-gray-500 mt-1">
                {bounty.price_type === "fixed" ? "fixed" : "/hr"}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}