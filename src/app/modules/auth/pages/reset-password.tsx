import placeholderImage from "@/assets/login-bg.png";
import doculocIcon from "@/assets/logo.svg";
import { Helmet } from "react-helmet-async";
import { ResetPasswordForm } from "../components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <Helmet title="Redefinir senha" />

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex flex-col gap-2 font-medium">
            <img src={doculocIcon} alt="Logo" className="w-30" />
            <span className="text-xs text-muted-foreground tracking-wide uppercase font-mono">
              Garantia Locatícia
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={placeholderImage}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2]"
        />
      </div>
    </>
  );
}
