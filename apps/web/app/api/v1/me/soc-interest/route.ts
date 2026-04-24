import { socInterestSubmissionSchema } from "@petadot/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { submitCustomerSocInterest, successResponse } = await import(
      "../../../../../src/lib/customer-workspace"
    );
    const input = socInterestSubmissionSchema.parse(await request.json());
    const result = await submitCustomerSocInterest(input);
    return successResponse(result, 201);
  } catch (error) {
    const { errorResponse } = await import("../../../../../src/lib/customer-workspace");
    return errorResponse(error);
  }
}
