import { Suspense } from "react";
import { JudgeLoginForm } from "./login-form";

export default function JudgeLoginPage() {
  return (
    <Suspense>
      <JudgeLoginForm />
    </Suspense>
  );
}
