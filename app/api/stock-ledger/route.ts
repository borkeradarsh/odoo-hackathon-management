import { NextResponse } from 'next/server';
import { getStockLedger } from '@/lib/data';

export async function GET() {
  try {
    const { data, error } = await getStockLedger();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stock ledger data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Unexpected error in stock ledger API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}