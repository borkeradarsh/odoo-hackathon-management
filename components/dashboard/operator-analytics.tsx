"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export type OperatorAnalyticsData = {
  id: string;
  name: string;
  completed: number;
  assigned: number;
  in_progress: number;
};

interface OperatorAnalyticsProps {
  data: OperatorAnalyticsData[];
}

export function OperatorAnalytics({ data }: OperatorAnalyticsProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-white border shadow-md mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <ClipboardList className="h-5 w-5" />
            Operator Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No operator analytics available.</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-white border shadow-md mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <ClipboardList className="h-5 w-5" />
          Operator Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#334155', fontWeight: 600 }} />
              <YAxis tick={{ fill: '#334155', fontWeight: 600 }} allowDecimals={false} />
              <Tooltip wrapperClassName="!bg-white !text-slate-800 !border !border-slate-200" />
              <Legend wrapperStyle={{ color: '#334155', fontWeight: 600 }} />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="in_progress" fill="#3b82f6" name="In Progress" radius={[4, 4, 0, 0]} />
              <Bar dataKey="assigned" fill="#f59e42" name="Assigned" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(op => (
            <div key={op.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
              <div className="font-semibold text-slate-800 text-lg mb-1">{op.name}</div>
              <div className="flex gap-4 text-sm">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Completed: {op.completed}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">In Progress: {op.in_progress}</span>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Assigned: {op.assigned}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
