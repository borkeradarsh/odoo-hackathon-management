import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServer();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workOrderId = parseInt(params.id);

    if (!workOrderId || isNaN(workOrderId)) {
      return NextResponse.json(
        { error: 'Invalid work order ID' },
        { status: 400 }
      );
    }

    // First, verify that this work order is assigned to the current user
    const { data: workOrder, error: fetchError } = await supabase
      .from('work_orders')
      .select('id, operator_id, status')
      .eq('id', workOrderId)
      .eq('operator_id', user.id)
      .single();

    if (fetchError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found or not assigned to you' },
        { status: 404 }
      );
    }

    if (workOrder.status === 'completed') {
      return NextResponse.json(
        { error: 'Work order is already completed' },
        { status: 400 }
      );
    }

    // Update the work order status to completed
    const { data: updatedWorkOrder, error: updateError } = await supabase
      .from('work_orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', workOrderId)
      .eq('operator_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating work order:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete work order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkOrder
    });

  } catch (error) {
    console.error('Unexpected error completing work order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}