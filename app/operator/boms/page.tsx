                  "use client";

                  import React, { useState, useEffect } from "react";
                  import { ProtectedRoute } from "@/components/auth/protected-route";
                  import { Sidebar } from "@/components/layout/sidebar";
                  import { PageHeader } from "@/components/layout/page-header";
                  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
                  import { Button } from "@/components/ui/button";
                  import { Badge } from "@/components/ui/badge";
                  import {
                    Table,
                    TableBody,
                    TableCell,
                    TableHead,
                    TableHeader,
                    TableRow,
                  } from "@/components/ui/table";
                  import { Alert, AlertDescription } from "@/components/ui/alert";
                  import { FileText, Package, Loader2, RefreshCw, Eye, Info } from "lucide-react";

                  interface BOMLine {
                    id: string;
                    product_id: string;
                    quantity: number;
                    component?: {
                      id: number;
                      name: string;
                      type: string;
                      stock_on_hand: number;
                    };
                  }

                  interface BOM {
                    id: string;
                    product_id: string;
                    created_at: string;
                    product?: {
                      id: number;
                      name: string;
                      type: string;
                    };
                    bom_items?: BOMLine[];
                  }

                  export default function OperatorBOMsPage() {
                    const [boms, setBoms] = useState<BOM[]>([]);
                    const [loading, setLoading] = useState(true);
                    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
                    const [expandedBOM, setExpandedBOM] = useState<string | null>(null);

                    useEffect(() => {
                      fetchBOMs();
                    }, []);

                    const fetchBOMs = async () => {
                      try {
                        setLoading(true);
                        const response = await fetch("/api/boms");
                        if (response.ok) {
                          const data = await response.json();
                          setBoms(data.data || []);
                        } else {
                          setAlert({ type: "error", message: "Failed to load Bills of Materials" });
                        }
                      } catch (error) {
                        setAlert({ type: "error", message: "Failed to load Bills of Materials" });
                      } finally {
                        setLoading(false);
                      }
                    };

                    const toggleBOMExpansion = (bomId: string) => {
                      setExpandedBOM(expandedBOM === bomId ? null : bomId);
                    };

                    return (
                      <ProtectedRoute allowedRoles={["operator"]}>
                        <Sidebar>
                          <div className="space-y-8 px-6 py-6 max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-2">
                              <PageHeader
                                title="Bills of Materials"
                                description="View production recipes and component requirements (Read-only)"
                              />
                              <Button onClick={fetchBOMs} variant="outline" disabled={loading} className="border-gray-300">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                              </Button>
                            </div>

                            <Alert className="border-blue-400 bg-blue-50 mb-4">
                              <Info className="h-5 w-5 text-blue-600 mr-2" />
                              <AlertDescription className="text-blue-700 text-sm">
                                This is a <span className="font-semibold">read-only view</span>. You can view BOM details but cannot create, edit, or delete BOMs. Contact your supervisor for any changes needed.
                              </AlertDescription>
                            </Alert>

                            {alert && (
                              <Alert className={`mb-4 ${alert.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
                                <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                              </Alert>
                            )}

                            <Card className="shadow-sm border-gray-200">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold text-gray-800">Total BOMs Available</CardTitle>
                                <FileText className="h-5 w-5 text-gray-400" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-extrabold text-gray-900">{boms.length}</div>
                                <p className="text-xs text-gray-500 mt-1">Production recipes in system</p>
                              </CardContent>
                            </Card>

                            <Card className="shadow-sm border-gray-200">
                              <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900">Bills of Materials</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {loading ? (
                                  <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-7 w-7 animate-spin mr-3 text-blue-500" />
                                    <span className="text-lg text-gray-700">Loading BOMs...</span>
                                  </div>
                                ) : boms.length === 0 ? (
                                  <div className="text-center py-10">
                                    <FileText className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-base mb-4">No Bills of Materials found</p>
                                  </div>
                                ) : (
                                  <Table className="rounded-lg overflow-hidden">
                                    <TableHeader className="bg-gray-100">
                                      <TableRow>
                                        <TableHead className="text-base font-semibold text-gray-700 py-3">Product</TableHead>
                                        <TableHead className="text-base font-semibold text-gray-700 py-3">Product Type</TableHead>
                                        <TableHead className="text-base font-semibold text-gray-700 py-3">Components</TableHead>
                                        <TableHead className="text-base font-semibold text-gray-700 py-3">Created</TableHead>
                                        <TableHead className="text-base font-semibold text-gray-700 py-3">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {boms.map((bom) => (
                                        <React.Fragment key={bom.id}>
                                          <TableRow className="hover:bg-gray-50 transition">
                                            <TableCell className="py-4">
                                              <div>
                                                <div className="font-semibold text-gray-900 text-lg">{bom.product?.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">ID: {bom.product?.id}</div>
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                              <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 bg-gray-100 text-gray-700">
                                                {bom.product?.type || "N/A"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                              <div className="flex flex-col gap-2">
                                                {bom.bom_items && bom.bom_items.length > 0 ? (
                                                  bom.bom_items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-2">
                                                      <span className="font-medium text-gray-800 text-sm">{item.component?.name}</span>
                                                      <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 bg-gray-100 text-gray-700">Type: {item.component?.type || "N/A"}</Badge>
                                                      <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-700">Stock: {item.component?.stock_on_hand ?? "N/A"}</Badge>
                                                      <Badge variant="secondary" className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700">Qty: {item.quantity}</Badge>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <span className="text-xs text-gray-400">No components</span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                              <span className="text-sm text-gray-700 font-medium">{new Date(bom.created_at).toLocaleDateString()}</span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleBOMExpansion(bom.id)}
                                                className="text-blue-600 hover:bg-blue-50 px-3 py-1 text-xs font-semibold"
                                              >
                                                <Eye className="h-4 w-4 mr-1" />
                                                {expandedBOM === bom.id ? "Hide" : "View"} Details
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                          {expandedBOM === bom.id && bom.bom_items && (
                                            <TableRow key={`${bom.id}-expanded`}>
                                              <TableCell colSpan={5} className="bg-gray-50 px-8 py-6">
                                                <div className="py-2">
                                                  <h4 className="font-bold text-lg mb-4 flex items-center text-gray-800">
                                                    <Package className="h-5 w-5 mr-2 text-gray-500" />
                                                    Required Components
                                                  </h4>
                                                  <div className="grid gap-3">
                                                    {bom.bom_items.map((item) => (
                                                      <div key={`${item.id}-expanded`} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                        <div className="flex items-center space-x-4">
                                                          <Package className="h-5 w-5 text-gray-400" />
                                                          <div>
                                                            <span className="font-semibold text-gray-900 text-base">{item.component?.name}</span>
                                                            <span className="text-xs text-gray-500 ml-2">(ID: {item.component?.id})</span>
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                          <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 bg-gray-100 text-gray-700">Qty: {item.quantity}</Badge>
                                                          <Badge className={(item.component?.stock_on_hand || 0) >= item.quantity ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>Stock: {item.component?.stock_on_hand}</Badge>
                                                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700">{item.component?.type}</Badge>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </Sidebar>
                      </ProtectedRoute>
                    );
                  }