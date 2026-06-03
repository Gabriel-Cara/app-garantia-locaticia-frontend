import placeholderImage from "@/assets/register-bg.png";
import doculocIcon from "@/assets/logo.svg";

import { RegisterForm } from "../components/register-form";
import { Helmet } from "react-helmet-async";

export default function RegisterPage() {
  return (
    <>
      <Helmet title="Cadastrar" />

      <div className="relative hidden bg-muted lg:block">
        <div className="absolute top-10 left-10 z-10 flex justify-center gap-2 md:justify-end ">
          <a href="#" className="flex flex-col items-center gap-2 font-medium">
            <img src={doculocIcon} alt="Logo" className="w-full max-w-35" />
            {/* <Separator /> */}
            <span className="text-xs text-foreground tracking-wide uppercase font-mono">
              Garantia Locatícia
            </span>
          </a>
        </div>
        <img
          src={placeholderImage}
          alt="Image"
          className="absolute h-full w-full object-cover dark:brightness-[0.2] opacity-90"
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
}
