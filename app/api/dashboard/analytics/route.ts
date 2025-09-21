// in app/api/dashboard/analytics/route.ts

import { NextResponse } from 'next/server';
// This is the function that contains your complex SQL query.
// Make sure the path is correct for your project structure.
import { getDashboardAnalytics } from '@/lib/data';
import { getNoCacheHeaders } from '@/lib/api-utils';

export async function GET() {
  try {
    const dashboardData = await getDashboardAnalytics();

    // The SQL query already formats the output as a single JSON object
    // under the key "dashboard_data". We return that directly.
    return NextResponse.json(dashboardData, {
      headers: getNoCacheHeaders()
    });

  } catch (error: unknown) {
    // Log the detailed error on the server for debugging
    console.error('API Error fetching dashboard analytics:', error);

    // Return a generic error message to the client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch dashboard analytics: ${errorMessage}` },
      { status: 500 }
    );
  }
}