import { feedbackSubmissionSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { submitCustomerFeedback, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = feedbackSubmissionSchema.parse(await request.json());
    const result = await submitCustomerFeedback(input);
    return successResponse(result, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
