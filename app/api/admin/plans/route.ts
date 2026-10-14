import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { validatePlan } from "@/lib/plan-directory";

export async function GET(req: Request) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;
  try {
    const snapshot = await auth.db.collection("plans").get();
    const plans = snapshot.docs.flatMap((doc) => {
      const plan = validatePlan(doc.data());
      return plan ? [{ ...plan, id: doc.id }] : [];
    }).sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ message: "Could not load plans. Please try again." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdminRequest(req);
  if (!auth.ok) return auth.response;
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ message: "Invalid plan data." }, { status: 400 });
  }
  const plan = validatePlan(body);
  if (!plan || (body.id !== undefined && (typeof body.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(body.id)))) {
    return NextResponse.json({ message: "Enter a plan name and an offered entity and account type. Plan administrator is optional and must be no more than 300 characters." }, { status: 400 });
  }
  try {
    const ref = body.id ? auth.db.collection("plans").doc(body.id) : auth.db.collection("plans").doc();
    if (body.id && !(await ref.get()).exists) return NextResponse.json({ message: "Plan not found." }, { status: 404 });
    await ref.set({ ...plan, updatedAt: new Date().toISOString(), updatedBy: auth.uid }, { merge: true });
    return NextResponse.json({ plan: { ...plan, id: ref.id } });
  } catch {
    return NextResponse.json({ message: "Could not save the plan. Please try again." }, { status: 500 });
  }
}
