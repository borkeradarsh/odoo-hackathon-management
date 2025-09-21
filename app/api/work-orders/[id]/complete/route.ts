import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServer();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 403 }
      );
    }

    if (profile.role !== 'operator' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const workOrderId = parseInt(id);

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

    if (workOrder.status === 'Done') {
      return NextResponse.json(
        { error: 'Work order is already completed' },
        { status: 400 }
      );
    }

    // Update the work order status to Done (based on schema constraint)
    const { data: updatedWorkOrder, error: updateError } = await supabase
      .from('work_orders')
      .update({ 
        status: 'Done'
        // Note: no updated_at field since it doesn't exist in schema
      })
      .eq('id', workOrderId)
      .eq('operator_id', user.id)
      .select();

    if (updateError) {
      console.error('Error updating work order:', updateError);
      console.error('Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to complete work order',
          details: updateError.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // Check if any records were updated
    if (!updatedWorkOrder || updatedWorkOrder.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found or not assigned to you' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkOrder[0] // Return the first (and should be only) updated record
    });

  } catch (error) {
    console.error('Unexpected error completing work order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}