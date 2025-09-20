"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyWorkOrdersPage() {
  // Fetch work orders assigned to the operator
  const { data, error, isLoading } = useSWR("/api/my-work-orders", fetcher);
  const workOrders = data?.work_orders || [];
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Mark work order as complete
  const handleComplete = async (workOrderId: number) => {
    setCompletingId(workOrderId);
    try {
      await fetch("/api/complete-work-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_order_id: workOrderId }),
      });
      mutate("/api/my-work-orders");
    } catch (err) {
      alert("Failed to complete work order.");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <div className="space-y-6">
          <PageHeader
            title="My Work Orders"
            description="View and complete your assigned tasks."
          />
          <Card>
            <CardHeader>
              <CardTitle>Assigned Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading work orders...</span>
                </div>
              ) : error ? (
                <div className="text-destructive py-8">Failed to load work orders.</div>
              ) : workOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No work orders assigned.
                </div>
              ) : (
                <div className="space-y-4">
                  {workOrders.map((wo: any) => (
                    <Card key={wo.id} className="border">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">{wo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            MO #{wo.mo_id} &middot; Product: {wo.product_name}
                          </div>
                        </div>
                        <Badge variant={wo.status === "Done" ? "default" : "secondary"}>
                          {wo.status}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            Quantity: <span className="font-semibold">{wo.quantity}</span>
                          </div>
                          {wo.status === "Pending" ? (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(wo.id)}
                              disabled={completingId === wo.id}
                            >
                              {completingId === wo.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Mark Complete
                            </Button>
                          ) : (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" /> Completed
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}
